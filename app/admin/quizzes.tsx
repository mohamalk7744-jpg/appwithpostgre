import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, View, Modal, FlatList } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface Question {
  id?: number;
  question: string;
  questionType: "short_answer" | "essay";
  correctAnswerText?: string;
  options: any[];
}

export default function QuizzesScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"monthly" | "semester">("monthly");
  const [questions, setQuestions] = useState<Question[]>([]);

  const utils = trpc.useUtils();
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: quizzes, isLoading, refetch } = trpc.quizzes.listBySubjectAndType.useQuery(
    { subjectId: selectedSubjectId || 0, type: type }, 
    { enabled: !!selectedSubjectId }
  );

  const createQuiz = trpc.quizzes.create.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم إضافة الاختبار الرسمي بنجاح");
      resetForm();
      refetch();
    }
  });

  const deleteQuiz = trpc.quizzes.delete.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم حذف الاختبار");
      refetch();
    }
  });

  const resetForm = () => {
    setIsAdding(false);
    setTitle("");
    setDescription("");
    setType("monthly");
    setQuestions([]);
  };

  const handleSaveQuiz = () => {
    if (!selectedSubjectId || !title) {
      Alert.alert("تنبيه", "يرجى اختيار مادة وإدخال عنوان");
      return;
    }
    createQuiz.mutate({
      subjectId: selectedSubjectId,
      title,
      description,
      type,
      questions: questions.map(q => ({...q, options: []}))
    });
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", questionType: "essay", options: [] }]);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.header}>
          <ThemedText type="title">الاختبارات الرسمية</ThemedText>
          <Pressable style={[styles.addButton, isAdding && styles.cancelButton]} onPress={() => isAdding ? resetForm() : setIsAdding(true)}>
            <ThemedText style={styles.addButtonText}>{isAdding ? "إلغاء" : "+ إضافة رسمي"}</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.label}>اختر المادة:</ThemedText>
          <Pressable style={styles.selector} onPress={() => setShowSubjectPicker(true)}>
            <ThemedText style={styles.selectorText}>{subjects?.find(s => s.id === selectedSubjectId)?.name || "اختر المادة..."}</ThemedText>
          </Pressable>
        </ThemedView>

        {isAdding && (
          <ThemedView style={styles.form}>
            <TextInput style={styles.input} placeholder="عنوان الاختبار (مثلاً: نصفي الفصل الأول)" value={title} onChangeText={setTitle} />
            <View style={styles.typeRow}>
               <Pressable style={[styles.typeBtn, type === "monthly" && styles.activeType]} onPress={() => setType("monthly")}><ThemedText>شهري</ThemedText></Pressable>
               <Pressable style={[styles.typeBtn, type === "semester" && styles.activeType]} onPress={() => setType("semester")}><ThemedText>فصلي</ThemedText></Pressable>
            </View>
            <ThemedText style={styles.formTitle}>الأسئلة المقالية ({questions.length})</ThemedText>
            {questions.map((q, idx) => (
              <TextInput key={idx} style={styles.input} placeholder={`السؤال ${idx + 1}`} value={q.question} onChangeText={(t) => {
                const newQs = [...questions]; newQs[idx].question = t; setQuestions(newQs);
              }} />
            ))}
            <Pressable style={styles.addQuestionBtn} onPress={addQuestion}><ThemedText>+ إضافة سؤال</ThemedText></Pressable>
            <Pressable style={styles.submitButton} onPress={handleSaveQuiz}><ThemedText style={styles.whiteText}>حفظ الاختبار</ThemedText></Pressable>
          </ThemedView>
        )}

        {!isAdding && selectedSubjectId && (
          <View style={styles.list}>
            {quizzes?.filter(q => q.type !== 'daily').map((quiz) => (
              <ThemedView key={quiz.id} style={styles.quizCard}>
                <View style={styles.cardTop}>
                  <Pressable onPress={() => deleteQuiz.mutate({id: quiz.id})}><Ionicons name="trash" size={20} color="#ff4444" /></Pressable>
                  <ThemedText type="defaultSemiBold">{quiz.title}</ThemedText>
                </View>
                <ThemedText style={styles.typeLabel}>{quiz.type === 'monthly' ? 'شهري' : 'فصلي'}</ThemedText>
              </ThemedView>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList data={subjects} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
              <Pressable style={styles.modalItem} onPress={() => { setSelectedSubjectId(item.id); setShowSubjectPicker(false); }}>
                <ThemedText>{item.name}</ThemedText>
              </Pressable>
            )} />
            <Pressable style={styles.modalClose} onPress={() => setShowSubjectPicker(false)}><ThemedText>إغلاق</ThemedText></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 16, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: '#fff' },
  addButton: { backgroundColor: "#6366F1", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: "#6B7280" },
  addButtonText: { color: "#fff", fontWeight: "600" },
  section: { padding: 16, backgroundColor: '#fff', marginBottom: 10 },
  label: { marginBottom: 8, textAlign: 'right' },
  selector: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  selectorText: { textAlign: 'right' },
  form: { padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, textAlign: 'right', marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  activeType: { backgroundColor: '#e0e7ff', borderColor: '#6366F1' },
  formTitle: { fontWeight: 'bold', textAlign: 'right', marginVertical: 10 },
  addQuestionBtn: { padding: 15, borderStyle: 'dashed', borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  submitButton: { backgroundColor: '#6366F1', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16 },
  quizCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeLabel: { color: '#6366F1', fontSize: 12, textAlign: 'right', marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalClose: { marginTop: 10, alignItems: 'center' }
});