
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trpc } from '@/lib/trpc';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'مرحباً! أنا مساعدك التعليمي الذكي. يرجى اختيار المادة الدراسية التي تود الاستفسار عنها من القائمة أعلاه لبدء المحادثة.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // جلب المواد التي يمتلك الطالب صلاحية الوصول إليها فقط
  const { data: mySubjects, isLoading: loadingSubjects } = trpc.subjects.listMySubjects.useQuery();
  const chatMutation = trpc.chat.ask.useMutation();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!selectedSubjectId) {
      Alert.alert('تنبيه', 'يرجى اختيار المادة الدراسية أولاً من القائمة العلوية ليتمكن البوت من مساعدتك بدقة.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        subjectId: selectedSubjectId,
        question: currentInput,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: result.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const botErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: 'عذراً، حدث خطأ في معالجة طلبك. قد يكون السبب مشكلة في الاتصال أو أن المادة المختارة لا تحتوي على منهج كافٍ.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const currentSubjectName = mySubjects?.find(s => s.id === selectedSubjectId)?.name;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">💬 المساعد الذكي</ThemedText>
          <ThemedText style={styles.subtitle}>
            {selectedSubjectId ? `أنت تسأل الآن في مادة: ${currentSubjectName}` : 'اختر مادة من الأعلى للبدء'}
          </ThemedText>
        </View>

        {/* Subject Selector */}
        <View style={styles.selectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScroll}>
            {loadingSubjects ? (
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
            ) : mySubjects?.length === 0 ? (
              <ThemedText style={styles.noSubjectsText}>لا توجد مواد متاحة لك حالياً</ThemedText>
            ) : (
              mySubjects?.map((subject) => (
                <Pressable
                  key={subject.id}
                  style={[
                    styles.subjectChip,
                    selectedSubjectId === subject.id && { backgroundColor: Colors[colorScheme ?? 'light'].tint, borderColor: Colors[colorScheme ?? 'light'].tint }
                  ]}
                  onPress={() => setSelectedSubjectId(subject.id)}
                >
                  <ThemedText style={[
                    styles.subjectChipText,
                    selectedSubjectId === subject.id && { color: '#fff', fontWeight: 'bold' }
                  ]}>
                    {subject.name}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.type === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'user'
                    ? [styles.userBubble, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
                    : [styles.botBubble, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f0f0f0' }],
                ]}
              >
                <ThemedText style={[
                  styles.messageText, 
                  message.type === 'user' && { color: '#fff' },
                  message.type === 'bot' && colorScheme === 'dark' && { color: '#e5e5e5' }
                ]}>
                  {message.text}
                </ThemedText>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="small" />
              <ThemedText style={styles.loadingText}>جاري التفكير...</ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="اكتب سؤالك هنا..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <Pressable 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={handleSendMessage}
              disabled={loading || !inputText.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

// Added styles definition
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'flex-end',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  selectorContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subjectScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  noSubjectsText: {
    padding: 10,
    color: '#999',
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  loadingWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#999',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    height: 45,
    textAlign: 'right',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  sendButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
