
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, View, ActivityIndicator, FlatList, TouchableOpacity, ScrollView, Animated, TextInput, Image, Alert, Modal, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

type Step = 'subjects' | 'types' | 'quizzes' | 'submissions' | 'grading';

export default function ResultsScreen() {
  const [step, setStep] = useState<Step>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<{ id: number, name: string } | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<{ id: number, title: string, resultsPublished?: number, modelAnswerText?: string, modelAnswerImageUrl?: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number, name: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [modelText, setModelText] = useState("");
  const [modelImage, setModelImage] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const utils = trpc.useUtils();
  const subjectsQuery = trpc.subjects.list.useQuery(undefined, { enabled: step === 'subjects' });
  const quizzesQuery = trpc.quizzes.listBySubjectAndType.useQuery(
    { subjectId: selectedSubject?.id ?? 0, type: selectedType ?? "" },
    { enabled: step === 'quizzes' && !!selectedSubject && !!selectedType }
  );
  const submissionsQuery = trpc.quizzes.getQuizSubmissions.useQuery(
    { quizId: selectedQuiz?.id ?? 0 },
    { enabled: step === 'submissions' && !!selectedQuiz }
  );
  const detailedSubmissionQuery = trpc.quizzes.getSubmissionDetails.useQuery(
    { studentId: selectedStudent?.id ?? 0, quizId: selectedQuiz?.id ?? 0 },
    { enabled: step === 'grading' && !!selectedStudent && !!selectedQuiz }
  );

  const updateModelAnswerMutation = trpc.quizzes.updateQuizModelAnswer.useMutation({
    onSuccess: () => {
      Alert.alert("نجاح", "تم تحديث الإجابة النموذجية بنجاح");
      utils.quizzes.listBySubjectAndType.invalidate();
    }
  });

  const publishResultsMutation = trpc.quizzes.publishResults.useMutation({
    onSuccess: () => {
      Alert.alert("نجاح", "تم نشر النتائج للطلاب");
      utils.quizzes.listBySubjectAndType.invalidate();
    }
  });

  const gradeMutation = trpc.quizzes.gradeAnswer.useMutation({
    onSuccess: () => detailedSubmissionQuery.refetch()
  });

  const quizTypes = [
    { id: 'daily', label: 'الاختبارات اليومية', icon: 'calendar', color: '#3B82F6' },
    { id: 'monthly', label: 'الاختبارات الشهرية', icon: 'document-text', color: '#8B5CF6' },
    { id: 'semester', label: 'الاختبارات الفصلية', icon: 'school', color: '#F59E0B' },
  ];

  const navigateTo = (nextStep: Step) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  const goBack = () => {
    if (step === 'grading') navigateTo('submissions');
    else if (step === 'submissions') navigateTo('quizzes');
    else if (step === 'quizzes') navigateTo('types');
    else if (step === 'types') navigateTo('subjects');
  };

  const pickModelImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("تنبيه", "نحتاج صلاحية الوصول للصور لرفع الإجابة النموذجية.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true
    });

    if (!result.canceled) {
      setModelImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const saveModelAnswer = async () => {
    if (!selectedQuiz) return;
    updateModelAnswerMutation.mutate({
      quizId: selectedQuiz.id,
      modelAnswerText: modelText,
      modelAnswerImageUrl: modelImage || undefined,
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <ThemedText type="title" style={styles.headerTitle}>مركز النتائج</ThemedText>
        {step !== 'subjects' && (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-forward-circle" size={32} color="#7c3aed" />
          </TouchableOpacity>
        )}
      </View>
      {step !== 'subjects' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breadcrumbScroll} contentContainerStyle={{flexDirection: 'row-reverse'}}>
          <View style={styles.breadcrumbItem}><ThemedText style={styles.breadcrumbText}>{selectedSubject?.name || '...'}</ThemedText></View>
          {selectedType && (
            <>
              <Ionicons name="chevron-back" size={14} color="#9CA3AF" />
              <View style={styles.breadcrumbItem}><ThemedText style={styles.breadcrumbText}>{quizTypes.find(t => t.id === selectedType)?.label || '...'}</ThemedText></View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderContent = () => {
    if (step === 'subjects') {
      return (
        <View style={styles.content}>
          <ThemedText style={styles.sectionTitle}>اختر المادة الدراسية</ThemedText>
          {subjectsQuery.isLoading ? <ActivityIndicator style={styles.loader} color="#7c3aed" /> : (
            <FlatList data={subjectsQuery.data} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={styles.subjectCard} onPress={() => { setSelectedSubject(item); navigateTo('types'); }}>
                <View style={[styles.subjectIcon, {backgroundColor: '#7c3aed'}]}><Ionicons name="book" size={24} color="#fff" /></View>
                <View style={styles.subjectInfo}><ThemedText style={styles.cardTitle}>{item.name}</ThemedText></View>
                <Ionicons name="chevron-back" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            )} />
          )}
        </View>
      );
    }
    if (step === 'types') {
      return (
        <View style={styles.content}>
          <ThemedText style={styles.sectionTitle}>اختر تصنيف الاختبار</ThemedText>
          <View style={styles.typeGrid}>
            {quizTypes.map((type) => (
              <TouchableOpacity key={type.id} style={[styles.typeCard, { borderTopColor: type.color }]} onPress={() => { setSelectedType(type.id); navigateTo('quizzes'); }}>
                <View style={[styles.typeIconContainer, { backgroundColor: type.color + '15' }]}><Ionicons name={type.icon as any} size={30} color={type.color} /></View>
                <ThemedText style={styles.typeLabel}>{type.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    if (step === 'quizzes') {
      return (
        <View style={styles.content}>
          <ThemedText style={styles.sectionTitle}>قائمة الاختبارات</ThemedText>
          {quizzesQuery.isLoading ? <ActivityIndicator style={styles.loader} color="#7c3aed" /> : (
            <FlatList data={quizzesQuery.data} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={styles.quizCard} onPress={() => { setSelectedQuiz(item as any); setModelText(item.modelAnswerText || ""); setModelImage(item.modelAnswerImageUrl || null); navigateTo('submissions'); }}>
                <View style={styles.quizInfo}><ThemedText style={styles.cardTitle}>{item.title}</ThemedText><ThemedText style={styles.cardSub}>{item.resultsPublished ? "تم النشر" : "بانتظار النشر"}</ThemedText></View>
                <Ionicons name="chevron-back" size={20} color="#7c3aed" />
              </TouchableOpacity>
            )} />
          )}
        </View>
      );
    }
    if (step === 'submissions') {
      return (
        <ScrollView style={styles.content}>
          {selectedType !== 'daily' && (
            <View style={styles.adminSection}>
              <ThemedText style={styles.adminTitle}>الإجابة النموذجية للاختبار</ThemedText>
              <TextInput style={styles.textArea} placeholder="أدخل نص الإجابة النموذجية هنا..." value={modelText} onChangeText={setModelText} multiline />
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickModelImage}>
                <Ionicons name="camera" size={20} color="#fff" />
                <ThemedText style={styles.whiteText}>إرفاق صورة الإجابة</ThemedText>
              </TouchableOpacity>
              {modelImage && <Image source={{ uri: modelImage }} style={styles.previewImage} />}
              <TouchableOpacity style={styles.saveBtn} onPress={saveModelAnswer} disabled={updateModelAnswerMutation.isPending}><ThemedText style={styles.whiteText}>حفظ الإجابة النموذجية</ThemedText></TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={[styles.publishBtn, selectedQuiz?.resultsPublished && styles.disabledBtn]} onPress={() => Alert.alert("تأكيد", "هل أنت متأكد من نشر النتائج؟", [{ text: "إلغاء", style: "cancel" }, { text: "نشر الآن", onPress: () => publishResultsMutation.mutate({ quizId: selectedQuiz!.id }) }])} disabled={selectedQuiz?.resultsPublished === 1 || publishResultsMutation.isPending}>
                <Ionicons name="megaphone" size={20} color="#fff" />
                <ThemedText style={styles.whiteText}>{selectedQuiz?.resultsPublished ? "تم نشر النتائج" : "نشر النتائج للطلاب"}</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <ThemedText style={styles.sectionTitle}>إجابات الطلاب</ThemedText>
          {submissionsQuery.isLoading ? <ActivityIndicator color="#7c3aed" /> : submissionsQuery.data?.map((item) => (
            <TouchableOpacity key={item.studentId} style={styles.resultRow} onPress={() => { if (selectedType !== 'daily') { setSelectedStudent({ id: item.studentId, name: item.studentName }); navigateTo('grading'); } }}>
              <View style={styles.studentDetails}><ThemedText style={styles.studentName}>{item.studentName}</ThemedText></View>
              <View style={styles.percentageContainer}><ThemedText style={styles.percentageText}>{item.percentage}%</ThemedText></View>
              {selectedType !== 'daily' && <Ionicons name="create-outline" size={24} color="#7c3aed" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
    if (step === 'grading') {
      return (
        <ScrollView style={styles.content}>
          <ThemedText style={styles.sectionTitle}>تصحيح إجابة: {selectedStudent?.name}</ThemedText>
          {detailedSubmissionQuery.isLoading ? <ActivityIndicator color="#7c3aed" /> : detailedSubmissionQuery.data?.map((ans) => (
            <View key={ans.answerId} style={styles.gradingCard}>
              <ThemedText style={styles.questionText}>{ans.question}</ThemedText>
              {ans.textAnswer ? <View style={styles.textAnswerBox}><ThemedText style={styles.studentTextAns}>{ans.textAnswer}</ThemedText></View> : null}
              {ans.imageUrl ? <TouchableOpacity style={styles.imageContainer} onPress={() => setPreviewImage(ans.imageUrl)}><Image source={{ uri: ans.imageUrl }} style={styles.ansImage} resizeMode="cover" /></TouchableOpacity> : null}
              <View style={styles.scoreAction}>
                <ThemedText>الدرجة:</ThemedText>
                <View style={styles.scoreBtns}>
                  <TouchableOpacity style={[styles.scoreBtn, ans.score === 1 && styles.scoreBtnActive]} onPress={() => gradeMutation.mutate({ answerId: ans.answerId, score: 1 })}><ThemedText style={ans.score === 1 ? styles.whiteText : styles.blueText}>✓ 1</ThemedText></TouchableOpacity>
                  <TouchableOpacity style={[styles.scoreBtn, ans.score === 0 && styles.scoreBtnWrong]} onPress={() => gradeMutation.mutate({ answerId: ans.answerId, score: 0 })}><ThemedText style={ans.score === 0 ? styles.whiteText : styles.redText}>✗ 0</ThemedText></TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        {renderContent()}
      </Animated.View>
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.fullImageOverlay}>
          <TouchableOpacity style={styles.closeFullImage} onPress={() => setPreviewImage(null)}><Ionicons name="close-circle" size={40} color="#fff" /></TouchableOpacity>
          {previewImage && <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  headerTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  backButton: { padding: 2 },
  breadcrumbScroll: { marginTop: 5 },
  breadcrumbItem: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginHorizontal: 4 },
  breadcrumbText: { fontSize: 13, color: '#4B5563' },
  animatedContainer: { flex: 1 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 16, textAlign: 'right' },
  subjectCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12, elevation: 2 },
  subjectIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  subjectInfo: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  typeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  typeCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 15, borderTopWidth: 4, elevation: 2 },
  typeIconContainer: { padding: 15, borderRadius: 20, marginBottom: 10 },
  typeLabel: { fontWeight: 'bold', fontSize: 15 },
  quizCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 },
  quizInfo: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  cardSub: { fontSize: 12, color: '#6B7280' },
  resultRow: { backgroundColor: '#fff', borderRadius: 16, padding: 15, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  studentDetails: { flex: 1, alignItems: 'flex-end' },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  percentageContainer: { width: 60, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  percentageText: { fontWeight: '800', color: '#7c3aed' },
  loader: { marginTop: 40 },
  adminSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  adminTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 10 },
  textArea: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, textAlign: 'right', minHeight: 80, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  imagePickerBtn: { backgroundColor: '#7c3aed', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, gap: 8, marginBottom: 10 },
  whiteText: { color: '#fff' },
  previewImage: { width: '100%', height: 150, borderRadius: 12, marginBottom: 10 },
  saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center' },
  publishBtn: { backgroundColor: '#8B5CF6', padding: 15, borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  gradingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15 },
  questionText: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 15 },
  textAnswerBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 10 },
  studentTextAns: { textAlign: 'right' },
  imageContainer: { borderRadius: 8, overflow: 'hidden', height: 200, marginBottom: 10 },
  ansImage: { width: '100%', height: '100%' },
  scoreAction: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  scoreBtns: { flexDirection: 'row', gap: 10 },
  scoreBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#7c3aed' },
  scoreBtnActive: { backgroundColor: '#7c3aed' },
  scoreBtnWrong: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  blueText: { color: '#7c3aed' },
  redText: { color: '#EF4444' },
  fullImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  closeFullImage: { position: 'absolute', top: 40, right: 20 },
  fullImage: { width: '100%', height: '80%' },
  disabledBtn: { backgroundColor: '#D1D5DB' }
});
