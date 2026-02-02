import { useState } from "react";
import { StyleSheet, ScrollView, View, Pressable, TextInput, ActivityIndicator, Alert, Modal, FlatList } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";

export default function DailyQuizzesAdmin() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  
  // Quiz state
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([{ 
    question: "", 
    options: ["", "", "", ""], 
    correctIndex: 0 
  }]);

  const { data: subjects } = trpc.subjects.list.useQuery();
  const quizQuery = trpc.quizzes.getDailyForLesson.useQuery(
    { subjectId: selectedSubjectId || 0, dayNumber: selectedDay },
    { enabled: !!selectedSubjectId }
  );
  
  const gradesQuery = trpc.quizzes.getQuizSubmissions.useQuery(
    { quizId: quizQuery.data?.id || 0 },
    { enabled: showGrades && !!quizQuery.data }
  );

  const createMutation = trpc.quizzes.create.useMutation({
    onSuccess: () => {
      Alert.alert("نجاح", "تم حفظ الاختبار اليومي");
      setIsAdding(false);
      setTitle("");
      setQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
      quizQuery.refetch();
    }
  });

  const deleteMutation = trpc.quizzes.delete.useMutation({
    onSuccess: () => {
      Alert.alert("تم", "تم حذف الاختبار");
      quizQuery.refetch();
    }
  });

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  };

  const handleSave = () => {
    if (!selectedSubjectId || !title) return Alert.alert("خطأ", "أكمل البيانات");
    createMutation.mutate({
      subjectId: selectedSubjectId,
      title,
      type: "daily",
      dayNumber: selectedDay,
      questions: questions.map(q => ({
        question: q.question,
        questionType: "multiple_choice",
        options: q.options.map((opt: string, i: number) => ({ text: opt, isCorrect: i === q.correctIndex }))
      }))
    });
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">إدارة التحديات اليومية</ThemedText>
        <ThemedText style={styles.subtitle}>أسئلة خيارات، تصحيح تلقائي، درجة أول محاولة</ThemedText>
      </ThemedView>

      <View style={styles.selectors}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
          {subjects?.map(s => (
            <Pressable key={s.id} style={[styles.chip, selectedSubjectId === s.id && styles.activeChip]} onPress={() => setSelectedSubjectId(s.id)}>
              <ThemedText style={selectedSubjectId === s.id && styles.whiteText}>{s.name}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {selectedSubjectId && (
          <View style={styles.dayPicker}>
            <ThemedText style={{fontWeight: 'bold'}}>اليوم:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                <Pressable key={d} style={[styles.dayBtn, selectedDay === d && styles.activeDay]} onPress={() => setSelectedDay(d)}>
                  <ThemedText style={selectedDay === d && styles.whiteText}>{d}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {quizQuery.isLoading ? (
          <ActivityIndicator color="#F59E0B" />
        ) : quizQuery.data ? (
          <View style={styles.quizDetail}>
            <View style={styles.quizHeader}>
              <Pressable onPress={() => deleteMutation.mutate({id: quizQuery.data!.id})}><Ionicons name="trash" size={24} color="#EF4444" /></Pressable>
              <ThemedText type="subtitle">{quizQuery.data.title}</ThemedText>
            </View>
            <ThemedText style={styles.qCount}>يحتوي على {quizQuery.data.questions?.length} سؤال</ThemedText>
            
            <View style={styles.actionRow}>
               <Pressable style={styles.statsBtn} onPress={() => setShowGrades(true)}>
                 <Ionicons name="stats-chart" size={20} color="#fff" />
                 <ThemedText style={styles.whiteText}>عرض درجات الطلاب</ThemedText>
               </Pressable>
            </View>
          </View>
        ) : selectedSubjectId ? (
          <Pressable style={styles.addPlaceholder} onPress={() => setIsAdding(true)}>
            <Ionicons name="add-circle" size={48} color="#F59E0B" />
            <ThemedText style={{marginTop: 10, fontSize: 16}}>إضافة اختبار لليوم {selectedDay}</ThemedText>
          </Pressable>
        ) : (
          <ThemedText style={styles.empty}>يرجى اختيار مادة لعرض الاختبارات اليومية</ThemedText>
        )}
      </ScrollView>

      {/* Modal: Add Daily Quiz */}
      <Modal visible={isAdding} animationType="slide">
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setIsAdding(false)}><Ionicons name="close" size={28} /></Pressable>
            <ThemedText type="subtitle">إضافة اختبار: اليوم {selectedDay}</ThemedText>
          </View>
          <ScrollView style={styles.modalBody}>
            <TextInput style={styles.input} placeholder="عنوان الاختبار" value={title} onChangeText={setTitle} />
            {questions.map((q, qIdx) => (
              <View key={qIdx} style={styles.qBox}>
                <TextInput style={styles.input} placeholder={`سؤال ${qIdx + 1}`} value={q.question} onChangeText={t => {
                  const n = [...questions]; n[qIdx].question = t; setQuestions(n);
                }} />
                {q.options.map((opt: string, oIdx: number) => (
                  <View key={oIdx} style={styles.optRow}>
                    <Pressable onPress={() => {
                      const n = [...questions]; n[qIdx].correctIndex = oIdx; setQuestions(n);
                    }}>
                      <Ionicons name={q.correctIndex === oIdx ? "radio-button-on" : "radio-button-off"} size={22} color="#F59E0B" />
                    </Pressable>
                    <TextInput style={styles.optInput} placeholder={`خيار ${oIdx + 1}`} value={opt} onChangeText={t => {
                      const n = [...questions]; n[qIdx].options[oIdx] = t; setQuestions(n);
                    }} />
                  </View>
                ))}
              </View>
            ))}
            <Pressable style={styles.addQBtn} onPress={handleAddQuestion}><ThemedText>+ سؤال إضافي</ThemedText></Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.whiteText}>حفظ الاختبار اليومي</ThemedText>}
            </Pressable>
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Modal: Grades List */}
      <Modal visible={showGrades} animationType="fade" transparent>
        <View style={styles.overlay}>
          <ThemedView style={styles.gradesContainer}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowGrades(false)}><Ionicons name="close" size={28} /></Pressable>
              <ThemedText type="subtitle">نتائج الطلاب (أول محاولة)</ThemedText>
            </View>
            {gradesQuery.isLoading ? (
              <ActivityIndicator color="#F59E0B" style={{padding: 40}} />
            ) : gradesQuery.data && gradesQuery.data.length > 0 ? (
              <FlatList
                data={gradesQuery.data}
                keyExtractor={item => item.studentId.toString()}
                renderItem={({item}) => (
                  <View style={styles.gradeRow}>
                    <ThemedText style={styles.gradeVal}>{item.percentage}%</ThemedText>
                    <ThemedText>{item.studentName}</ThemedText>
                  </View>
                )}
              />
            ) : (
              <ThemedText style={styles.empty}>لا توجد نتائج مسجلة لهذا اليوم</ThemedText>
            )}
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 50, backgroundColor: '#fff', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  selectors: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  subjectScroll: { marginBottom: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#fff' },
  activeChip: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  dayPicker: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  dayBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 5, backgroundColor: '#fff' },
  activeDay: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  addPlaceholder: { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', borderRadius: 24, marginTop: 30, backgroundColor: '#fff' },
  quizDetail: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  quizHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  qCount: { color: '#999', textAlign: 'right', marginTop: 5 },
  actionRow: { marginTop: 20 },
  statsBtn: { backgroundColor: '#F59E0B', padding: 15, borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10 },
  modalContainer: { flex: 1, paddingTop: 50 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalBody: { padding: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15, textAlign: 'right', marginBottom: 15, backgroundColor: '#fcfcfc' },
  qBox: { marginBottom: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
  optRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 },
  optInput: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 8, textAlign: 'right' },
  addQBtn: { padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F59E0B', borderRadius: 12, marginVertical: 10, borderStyle: 'dashed' },
  saveBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  gradesContainer: { backgroundColor: '#fff', borderRadius: 24, maxHeight: '80%', padding: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  gradeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#eee' },
  gradeVal: { fontWeight: 'bold', color: '#10B981', fontSize: 16 },
  empty: { textAlign: 'center', padding: 40, color: '#999', fontSize: 15 }
});