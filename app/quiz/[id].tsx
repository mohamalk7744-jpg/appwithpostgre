import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator, Alert, TextInput, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const quizId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selectedOptionId?: number, textAnswer?: string, imageUrl?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score?: number; totalQuestions?: number; correctAnswers?: number, status: string } | null>(null);

  const { data: quiz, isLoading } = trpc.quizzes.getById.useQuery({ id: quizId });
  const uploadMutation = trpc.storage.upload.useMutation();
  const submitMutation = trpc.quizzes.submit.useMutation();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <View style={styles.centered}>
        <ThemedText>هذا الاختبار غير متوفر حالياً أو لا يحتوي على أسئلة.</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>رجوع</ThemedText>
        </Pressable>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSelectOption = (questionId: number, optionId: number) => {
    setAnswers(prev => ({ 
      ...prev, 
      [questionId]: { ...prev[questionId], selectedOptionId: optionId } 
    }));
  };

  const handleUpdateText = (questionId: number, text: string) => {
    setAnswers(prev => ({ 
      ...prev, 
      [questionId]: { ...prev[questionId], textAnswer: text } 
    }));
  };

  const pickImage = async (questionId: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setAnswers(prev => ({ 
        ...prev, 
        [questionId]: { ...prev[questionId], imageUrl: result.assets[0].uri } 
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const currentAns = answers[currentQuestion.id];
    if (currentQuestion.questionType === 'multiple_choice' && !currentAns?.selectedOptionId) {
      Alert.alert("تنبيه", "يرجى اختيار إجابة.");
      return;
    }
    if (currentQuestion.questionType !== 'multiple_choice' && !currentAns?.textAnswer && !currentAns?.imageUrl) {
      Alert.alert("تنبيه", "يرجى كتابة إجابة أو رفع صورة للحل.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = [];
      
      for (const [qId, data] of Object.entries(answers)) {
        let finalImageUrl = data.imageUrl;
        
        // If it's a local file, convert to Base64 and store directly
        if (data.imageUrl && (data.imageUrl.startsWith('file://') || data.imageUrl.startsWith('/'))) {
          try {
            const base64 = await FileSystem.readAsStringAsync(data.imageUrl, { encoding: 'base64' });
            const fileExt = data.imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
            // Store as data URI
            finalImageUrl = `data:${mimeType};base64,${base64}`;
          } catch (err: any) {
            console.error("Base64 conversion error for question", qId, err);
          }
        }

        formattedAnswers.push({
          questionId: Number(qId),
          selectedOptionId: data.selectedOptionId,
          textAnswer: data.textAnswer,
          imageUrl: finalImageUrl,
        });
      }

      const result = await submitMutation.mutateAsync({
        quizId: quizId,
        answers: formattedAnswers,
      });

      // Calculate score for daily quizzes locally for immediate feedback
      if (quiz.type === 'daily') {
        let correctCount = 0;
        quiz.questions.forEach((q: any) => {
          const ans = answers[q.id];
          if (ans?.selectedOptionId) {
            const correctOpt = q.options.find((o: any) => o.isCorrect === 1);
            if (correctOpt && correctOpt.id === ans.selectedOptionId) {
              correctCount++;
            }
          }
        });
        setScoreResult({
          correctAnswers: correctCount,
          totalQuestions: quiz.questions.length,
          score: correctCount,
          status: 'submitted'
        });
      } else {
        setScoreResult(result);
      }
      
      setShowResult(true);
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("خطأ", "فشل في إرسال الإجابات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult && scoreResult) {
    const isDaily = quiz.type === 'daily';
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.resultCard}>
            <View style={styles.successIconContainer}>
              <Ionicons 
                name={isDaily ? "trophy" : "checkmark-circle"} 
                size={100} 
                color={isDaily ? "#F59E0B" : "#34C759"} 
              />
            </View>
            
            <ThemedText type="title" style={styles.successTitle}>
              {isDaily ? "اكتمل الاختبار اليومي!" : "تم إرسال إجابتك بنجاح!"}
            </ThemedText>
            
            {isDaily ? (
              <View style={styles.scoreBox}>
                <ThemedText style={styles.scoreLabel}>نتيجتك:</ThemedText>
                <ThemedText style={styles.scoreValue}>
                  {scoreResult.correctAnswers} / {scoreResult.totalQuestions}
                </ThemedText>
                <ThemedText style={styles.scorePercent}>
                  {Math.round((scoreResult.correctAnswers! / scoreResult.totalQuestions!) * 100)}%
                </ThemedText>
              </View>
            ) : (
              <View style={styles.successMessageBox}>
                <Ionicons name="notifications" size={24} color="#007AFF" />
                <ThemedText style={styles.successMessage}>
                  شكراً لإكمال الاختبار. ستظهر درجاتك بعد تصحيح المعلم.
                </ThemedText>
              </View>
            )}

            <Pressable 
              style={styles.returnButton} 
              onPress={() => router.replace(isDaily ? "/(tabs)" : "/(tabs)/exams")}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <ThemedText style={styles.returnButtonText}>
                {isDaily ? "العودة للرئيسية" : "العودة للاختبارات"}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <ThemedText style={styles.closeIcon}>✕</ThemedText>
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }]} />
        </View>
        <ThemedText style={styles.progressText}>
          {currentQuestionIndex + 1} / {quiz.questions.length}
        </ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionHeader}>
          {currentQuestion.questionType !== 'multiple_choice' && (
            <View style={styles.manualBadge}>
              <ThemedText style={styles.manualBadgeText}>تصحيح يدوي</ThemedText>
            </View>
          )}
          <ThemedText style={styles.questionText}>{currentQuestion.question}</ThemedText>
        </View>
        
        {currentQuestion.questionType === 'multiple_choice' ? (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option: any) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionCard,
                  answers[currentQuestion.id]?.selectedOptionId === option.id && styles.optionSelected
                ]}
                onPress={() => handleSelectOption(currentQuestion.id, option.id)}
              >
                <View style={[
                  styles.radio,
                  answers[currentQuestion.id]?.selectedOptionId === option.id && styles.radioSelected
                ]} />
                <ThemedText style={[
                  styles.optionText,
                  answers[currentQuestion.id]?.selectedOptionId === option.id && styles.optionTextSelected
                ]}>
                  {option.text}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.manualAnswerContainer}>
            <TextInput
              style={styles.textAnswerInput}
              placeholder="اكتب إجابتك هنا..."
              multiline
              value={answers[currentQuestion.id]?.textAnswer}
              onChangeText={(text) => handleUpdateText(currentQuestion.id, text)}
              textAlign="right"
            />
            
            <ThemedText style={styles.orText}>أو</ThemedText>
            
            <Pressable style={styles.uploadButton} onPress={() => pickImage(currentQuestion.id)}>
              <Ionicons name="camera-outline" size={24} color="#007AFF" />
              <ThemedText style={styles.uploadButtonText}>رفع صورة للحل</ThemedText>
            </Pressable>
            
            {answers[currentQuestion.id]?.imageUrl && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: answers[currentQuestion.id].imageUrl }} style={styles.imagePreview} />
                <Pressable 
                  style={styles.removeImage} 
                  onPress={() => {
                     const newAns = { ...answers[currentQuestion.id] };
                     delete newAns.imageUrl;
                     setAnswers({ ...answers, [currentQuestion.id]: newAns });
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextButton, isSubmitting && styles.disabledButton]} 
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ThemedText style={styles.nextButtonText}>
                {currentQuestionIndex === quiz.questions.length - 1 ? "إنهاء الاختبار" : "السؤال التالي"}
              </ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: '#999',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    width: 40,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  manualBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  manualBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginLeft: 12,
  },
  radioSelected: {
    borderColor: '#007AFF',
    borderWidth: 6,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  manualAnswerContainer: {
    gap: 16,
  },
  textAnswerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    height: 150,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImage: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  backButtonText: {
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  scorePercent: {
    fontSize: 18,
    color: '#F59E0B',
    marginTop: 4,
  },
  successMessageBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  successMessage: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'right',
  },
  returnButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
