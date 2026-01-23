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
      text: 'مرحباً! أنا مساعدك التعليمي الذكي. يرجى اختيار المادة الدراسية التي تود الاستفسار عنها من القائمة أعلاه.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch only subjects the student is subscribed to
  const { data: mySubjects, isLoading: loadingSubjects } = trpc.subjects.listMySubjects.useQuery();
  const chatMutation = trpc.chat.ask.useMutation();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!selectedSubjectId) {
      Alert.alert('تنبيه', 'يرجى اختيار المادة الدراسية أولاً من الأعلى');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        subjectId: selectedSubjectId,
        question: inputText,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: result.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">💬 البوت التعليمي</ThemedText>
          <ThemedText style={styles.subtitle}>
            اختر المادة ثم اسأل ما تريد حول المنهاج
          </ThemedText>
        </View>

        {/* Subject Selector */}
        <View style={styles.selectorContainer}>
          <ThemedText style={styles.selectorLabel}>المادة المحددة:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScroll}>
            {loadingSubjects ? (
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
            ) : mySubjects?.length === 0 ? (
              <ThemedText style={styles.noSubjectsText}>لا توجد مواد مشترك بها حالياً</ThemedText>
            ) : (
              mySubjects?.map((subject) => (
                <Pressable
                  key={subject.id}
                  style={[
                    styles.subjectChip,
                    selectedSubjectId === subject.id && { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                  ]}
                  onPress={() => setSelectedSubjectId(subject.id)}
                >
                  <ThemedText style={[
                    styles.subjectChipText,
                    selectedSubjectId === subject.id && { color: '#fff' }
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
                    : [styles.botBubble, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }],
                ]}
              >
                <ThemedText style={[styles.messageText, message.type === 'user' && { color: '#fff' }]}>
                  {message.text}
                </ThemedText>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="small" />
              <ThemedText style={styles.loadingText}>جاري تحليل المنهج والرد...</ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: 'rgba(0,0,0,0.1)',
                color: Colors[colorScheme ?? 'light'].text,
                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
              },
            ]}
            placeholder={selectedSubjectId ? "اكتب سؤالك هنا..." : "اختر مادة أولاً..."}
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            editable={!loading && !!selectedSubjectId}
            multiline
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              (loading || !inputText.trim() || !selectedSubjectId) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={loading || !inputText.trim() || !selectedSubjectId}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'right',
  },
  selectorContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
    paddingHorizontal: 10,
  },
  subjectScroll: {
    paddingHorizontal: 10,
    gap: 8,
    flexDirection: 'row-reverse',
  },
  subjectChip: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  subjectChipText: {
    fontSize: 13,
    color: '#666',
  },
  noSubjectsText: {
    fontSize: 12,
    color: '#ff4444',
    textAlign: 'center',
    width: '100%',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
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
    borderRadius: 15,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  botBubble: {
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  loadingWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
    textAlign: 'right',
    maxHeight: 100,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
