
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, View, Pressable, ActivityIndicator, Alert, TextInput, Image, ScrollView, Platform } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const quizId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selectedOptionId?: number, textAnswer?: string, imageUrl?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scoreResult, setScoreResult] = useState<{correct: number, total: number} | null>(null);

  const { data: quiz, isLoading } = trpc.quizzes.getById.useQuery({ id: quizId });
  const { data: status, refetch: refetchStatus } = trpc.quizzes.getExamsWithStatus.useQuery({ quizIds: [quizId] });
  const submitMutation = trpc.quizzes.submit.useMutation();

  const isDaily = quiz?.type === 'daily';
  const hasAttempted = status?.[quizId]?.hasAttempted;
  const isFirstAttempt = !hasAttempted;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (showResult || !isDaily || !isFirstAttempt) return;
      e.preventDefault();
      Alert.alert(
        "تنبيه هام",
        "هل أنت متأكد من الخروج؟ لن يتم احتساب درجتك إذا خرجت الآن دون إرسال الحل.",
        [
          { text: "إكمال الاختبار", style: "cancel" },
          { text: "خروج", style: "destructive", onPress: () => navigation.dispatch(e.data.action) }
        ]
      );
    });
    return unsubscribe;
  }, [navigation, showResult, isDaily, isFirstAttempt]);

  const handlePickImage = async (questionId: number) => {
    try {
      // التحقق من وجود الوحدة البرمجية قبل الطلب لتجنب الـ Crash
      if (!ImagePicker.launchCameraAsync) {
        Alert.alert("خطأ", "هذه الميزة غير مدعومة في هذه النسخة من التطبيق.");
        return;
      }

      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || libStatus !== 'granted') {
        Alert.alert("عذراً", "نحتاج لصلاحية الكاميرا والصور لتتمكن من رفع الحل.");
        return;
      }

      Alert.alert(
        "رفع الحل",
        "اختر مصدر الصورة",
        [
          { text: "الكاميرا", onPress: () => processImage(questionId, 'camera') },
          { text: "معرض الصور", onPress: () => processImage(questionId, 'library') },
          { text: "إلغاء", style: "cancel" }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert("خطأ", "فشل الوصول للكاميرا. تأكد من إعدادات الهاتف.");
    }
  };

  const processImage = async (questionId: number, type: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    };

    const result = type === 'camera' 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setAnswers({...answers, [questionId]: { ...answers[questionId], imageUrl: base64 }});
    }
  };

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  if (!quiz) return <View style={styles.centered}><ThemedText>الاختبار غير موجود</ThemedText></View>;

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedAnswers = quiz.questions.map((q: any) => ({
        questionId: q.id,
        ...answers[q.id]
      }));

      let correctCount = 0;
      if (isDaily) {
        quiz.questions.forEach((q: any) => {
          const studentAns = answers[q.id];
          if (studentAns?.selectedOptionId) {
            const correctOpt = q.options.find((o: any) => o.isCorrect === 1);
            if (correctOpt && correctOpt.id === studentAns.selectedOptionId) correctCount++;
          }
        });
        setScoreResult({ correct: correctCount, total: quiz.questions.length });
      }

      await submitMutation.mutateAsync({ quizId, answers: formattedAnswers, isFirstAttempt });
      setShowResult(true);
      refetchStatus();
    } catch (error) {
      Alert.alert("خطأ", "فشل في إرسال الإجابات، يرجى التحقق من الاتصال");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.resultCard}>
          <Ionicons name={isDaily ? "trophy" : "checkmark-circle"} size={100} color="#7c3aed" />
          <ThemedText type="title" style={{marginTop: 20}}>تم الإرسال بنجاح</ThemedText>
          {isDaily && scoreResult && (
            <View style={styles.scoreBox}>
              <ThemedText style={styles.scoreLabel}>درجتك في هذا الاختبار:</ThemedText>
              <ThemedText style={styles.scoreText}>{scoreResult.correct} / {scoreResult.total}</ThemedText>
              <ThemedText style={styles.scorePercentage}>{Math.round((scoreResult.correct/scoreResult.total)*100)}%</ThemedText>
            </View>
          )}
          {!isDaily && <ThemedText style={styles.resultNote}>تم استلام إجاباتك بنجاح. سيقوم المعلم بتصحيحها قريباً وإشعارك بالنتيجة.</ThemedText>}
          <Pressable style={styles.finishBtn} onPress={() => router.replace("/(tabs)")}>
            <ThemedText style={styles.whiteText}>العودة للرئيسية</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.progressText}>{currentQuestionIndex + 1} / {quiz.questions.length}</ThemedText>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }]} />
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#666" />
        </Pressable>
      </View>
      
      <ScrollView style={styles.questionContent}>
        <ThemedText style={styles.questionText}>{currentQuestion.question}</ThemedText>
        
        {currentQuestion.questionType === 'multiple_choice' && (
          <View style={styles.optionsList}>
            {currentQuestion.options.map((opt: any) => (
              <Pressable 
                key={opt.id} 
                style={[styles.optionCard, answers[currentQuestion.id]?.selectedOptionId === opt.id && styles.optionSelected]} 
                onPress={() => setAnswers({...answers, [currentQuestion.id]: {selectedOptionId: opt.id}})}
              >
                <View style={[styles.radio, answers[currentQuestion.id]?.selectedOptionId === opt.id && styles.radioSelected]} />
                <ThemedText style={[styles.optionText, answers[currentQuestion.id]?.selectedOptionId === opt.id && styles.optionTextSelected]}>{opt.text}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {currentQuestion.questionType !== 'multiple_choice' && (
          <View style={{gap: 15}}>
            <TextInput
              style={styles.textInput}
              placeholder="اكتب إجابتك هنا..."
              multiline
              value={answers[currentQuestion.id]?.textAnswer || ""}
              onChangeText={(t) => setAnswers({...answers, [currentQuestion.id]: { ...answers[currentQuestion.id], textAnswer: t}})}
            />
            
            <ThemedText style={{textAlign: 'right', fontWeight: 'bold', marginTop: 10}}>أو قم برفع صورة الحل:</ThemedText>
            <Pressable style={styles.imageUploadBtn} onPress={() => handlePickImage(currentQuestion.id)}>
              {answers[currentQuestion.id]?.imageUrl ? (
                <Image source={{ uri: answers[currentQuestion.id]?.imageUrl }} style={styles.uploadedPreview} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color="#7c3aed" />
                  <ThemedText style={{color: '#7c3aed'}}>التقاط صورة أو رفع من المعرض</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextBtn, isSubmitting && {opacity: 0.7}]} 
          onPress={() => currentQuestionIndex < quiz.questions.length - 1 ? setCurrentQuestionIndex(v => v + 1) : handleSubmit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.whiteText}>
              {currentQuestionIndex === quiz.questions.length - 1 ? "إنهاء وإرسال" : "السؤال التالي"}
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  progressText: { width: 50, textAlign: 'center', fontWeight: 'bold' },
  progressBarContainer: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', marginHorizontal: 12 },
  progressBarFill: { height: '100%', backgroundColor: '#7c3aed' },
  closeBtn: { padding: 4 },
  questionContent: { padding: 24 },
  questionText: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginBottom: 30, color: '#1a1a1a', lineHeight: 32 },
  optionsList: { gap: 12 },
  optionCard: { flexDirection: 'row-reverse', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fcfcfc', alignItems: 'center' },
  optionSelected: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', marginLeft: 12 },
  radioSelected: { borderColor: '#7c3aed', backgroundColor: '#7c3aed' },
  optionText: { fontSize: 16, textAlign: 'right', flex: 1, color: '#444' },
  optionTextSelected: { color: '#7c3aed', fontWeight: 'bold' },
  textInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 15, height: 120, textAlign: 'right', textAlignVertical: 'top', fontSize: 16 },
  imageUploadBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#7c3aed', borderRadius: 12, height: 150, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f5f3ff' },
  uploadedPreview: { width: '100%', height: '100%', borderRadius: 10 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f1f1' },
  nextBtn: { backgroundColor: '#7c3aed', padding: 18, borderRadius: 15, alignItems: 'center' },
  whiteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  scoreBox: { backgroundColor: '#f5f3ff', padding: 25, borderRadius: 24, alignItems: 'center', marginVertical: 30, width: '100%', borderWidth: 1, borderColor: '#7c3aed20' },
  scoreLabel: { fontSize: 16, color: '#666', marginBottom: 10 },
  scoreText: { fontSize: 48, fontWeight: '900', color: '#7c3aed' },
  scorePercentage: { fontSize: 20, fontWeight: 'bold', color: '#7c3aed', marginTop: 5 },
  resultNote: { textAlign: 'center', color: '#666', fontSize: 16, lineHeight: 24, marginVertical: 20 },
  finishBtn: { backgroundColor: '#7c3aed', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' }
});
