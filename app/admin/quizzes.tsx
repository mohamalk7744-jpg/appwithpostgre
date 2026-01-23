import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, View, Modal, FlatList } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface Question {
  id?: number;
  question: string;
  questionType: "multiple_choice" | "short_answer" | "essay";
  correctAnswerText?: string;
  correctAnswerImageUrl?: string;
  options: { id?: number; text: string; isCorrect: boolean }[];
}

export default function QuizzesScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showQuestionTypePicker, setShowQuestionTypePicker] = useState<{show: boolean, qIndex: number} | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"daily" | "monthly" | "semester">("daily");
  const [dayNumber, setDayNumber] = useState("");
  
  const [questions, setQuestions] = useState<Question[]>([]);

  const utils = trpc.useUtils();
  const { data: subjects } = trpc.subjects.list.useQuery();
  
  const { data: quizzes, isLoading, refetch } = trpc.quizzes.listBySubject.useQuery(
    { subjectId: selectedSubjectId || 0 },
    { enabled: !!selectedSubjectId }
  );

  const createQuiz = trpc.quizzes.create.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم إضافة الاختبار بنجاح");
      resetForm();
      refetch();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const deleteQuiz = trpc.quizzes.delete.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم حذف الاختبار بنجاح");
      refetch();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setType("daily");
    setDayNumber("");
    setQuestions([]);
  };

  const handleSaveQuiz = () => {
    if (!selectedSubjectId || !title) {
      Alert.alert("تنبيه", "يرجى اختيار مادة وإدخال عنوان للاختبار");
      return;
    }
    if (questions.length === 0) {
      Alert.alert("تنبيه", "يرجى إضافة سؤال واحد على الأقل");
      return;
    }

    for (const q of questions) {
      if (!q.question) {
        Alert.alert("تنبيه", "يرجى كتابة نص السؤال");
        return;
      }
      if (q.questionType === "multiple_choice") {
        if (q.options.length < 2) {
          Alert.alert("تنبيه", "يجب إضافة خيارين على الأقل لكل سؤال خيارات");
          return;
        }
        if (!q.options.some(o => o.isCorrect)) {
          Alert.alert("تنبيه", "يرجى تحديد إجابة صحيحة واحدة على الأقل لكل سؤال خيارات");
          return;
        }
      }
    }

    const quizData = {
      subjectId: selectedSubjectId,
      title,
      description,
      type,
      dayNumber: dayNumber ? parseInt(dayNumber) : undefined,
      questions: questions
    };

    if (editingId) {
      // For simplicity, we delete and recreate or we could add an update mutation
      // Since the schema is complex, let's add an update mutation in routers.ts if needed
      // For now, let's assume we use the create mutation and handle editing by deleting first
      Alert.alert("تنبيه", "تعديل الاختبارات قيد التطوير، حالياً يمكنك الحذف والإضافة");
    } else {
      createQuiz.mutate(quizData);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "حذف الاختبار",
      "هل أنت متأكد من رغبتك في حذف هذا الاختبار؟",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: () => deleteQuiz.mutate({ id }) }
      ]
    );
  };

  const addQuestion = () => {
    setQuestions([...questions, { 
      question: "", 
      questionType: type === "daily" ? "multiple_choice" : "multiple_choice",
      options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] 
    }]);
  };

  const removeQuestion = (index: number) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQs = [...questions];
    newQs[index].question = text;
    setQuestions(newQs);
  };

  const updateQuestionAnswerText = (index: number, text: string) => {
    const newQs = [...questions];
    newQs[index].correctAnswerText = text;
    setQuestions(newQs);
  };

  const setQuestionType = (index: number, qType: "multiple_choice" | "short_answer" | "essay") => {
    if (type === "daily" && qType !== "multiple_choice") {
      Alert.alert("تنبيه", "الاختبارات اليومية تدعم الخيارات المتعددة فقط");
      return;
    }
    const newQs = [...questions];
    newQs[index].questionType = qType;
    if (qType !== "multiple_choice") {
      newQs[index].options = [];
    } else if (newQs[index].options.length === 0) {
      newQs[index].options = [{ text: "", isCorrect: false }, { text: "", isCorrect: false }];
    }
    setQuestions(newQs);
    setShowQuestionTypePicker(null);
  };

  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQs);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex].text = text;
    setQuestions(newQs);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options = newQs[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === oIndex
    }));
    setQuestions(newQs);
  };

  const selectedSubject = subjects?.find(s => s.id === selectedSubjectId);
  const typeLabels = {
    daily: "اختبار يومي",
    monthly: "اختبار شهري",
    semester: "اختبار فصلي"
  };

  const qTypeLabels = {
    multiple_choice: "خيارات من متعدد",
    short_answer: "إجابة قصيرة",
    essay: "سؤال مقالي / مباشر"
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.header}>
          <ThemedText type="title">إدارة الاختبارات</ThemedText>
          <Pressable style={[styles.addButton, isAdding && styles.cancelButton]} onPress={() => isAdding ? resetForm() : setIsAdding(true)}>
            <ThemedText style={styles.addButtonText}>{isAdding ? "إلغاء" : "+ إضافة اختبار"}</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.label}>اختر المادة الدراسية:</ThemedText>
          <Pressable 
            style={styles.selector} 
            onPress={() => setShowSubjectPicker(true)}
          >
            <ThemedText style={selectedSubject ? styles.selectorText : styles.placeholderText}>
              {selectedSubject ? selectedSubject.name : "اضغط هنا لاختيار المادة..."}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {isAdding && (
          <ThemedView style={styles.form}>
            <ThemedText style={styles.formTitle}>بيانات الاختبار</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="عنوان الاختبار"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="وصف الاختبار"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#666"
            />
            
            <ThemedText style={styles.label}>نوع الاختبار:</ThemedText>
            <Pressable style={styles.selector} onPress={() => setShowTypePicker(true)}>
              <ThemedText style={styles.selectorText}>{typeLabels[type]}</ThemedText>
            </Pressable>

            {type === "daily" && (
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="مرتبط باليوم رقم"
                value={dayNumber}
                onChangeText={setDayNumber}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            )}

            <View style={styles.divider} />
            <ThemedText style={styles.formTitle}>الأسئلة ({questions.length})</ThemedText>

            {questions.map((q, qIndex) => (
              <View key={qIndex} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Pressable onPress={() => removeQuestion(qIndex)}>
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  </Pressable>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Pressable 
                      style={styles.qTypeBadge} 
                      onPress={() => type !== "daily" && setShowQuestionTypePicker({show: true, qIndex})}
                    >
                      <ThemedText style={styles.qTypeBadgeText}>{qTypeLabels[q.questionType]}</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.questionNumber}>سؤال {qIndex + 1}</ThemedText>
                  </View>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="نص السؤال"
                  value={q.question}
                  onChangeText={(text) => updateQuestionText(qIndex, text)}
                  placeholderTextColor="#666"
                  multiline
                />

                {q.questionType === "multiple_choice" ? (
                  <>
                    <ThemedText style={[styles.label, { marginTop: 10 }]}>الخيارات:</ThemedText>
                    {q.options.map((opt, oIndex) => (
                      <View key={oIndex} style={styles.optionRow}>
                        <Pressable 
                          style={[styles.radio, opt.isCorrect && styles.radioActive]} 
                          onPress={() => setCorrectOption(qIndex, oIndex)}
                        >
                          {opt.isCorrect && <View style={styles.radioInner} />}
                        </Pressable>
                        <TextInput
                          style={[styles.input, { flex: 1, marginRight: 10 }]}
                          placeholder={`خيار ${oIndex + 1}`}
                          value={opt.text}
                          onChangeText={(text) => updateOptionText(qIndex, oIndex, text)}
                          placeholderTextColor="#666"
                        />
                      </View>
                    ))}
                    <Pressable style={styles.addOptionBtn} onPress={() => addOption(qIndex)}>
                      <ThemedText style={styles.addOptionBtnText}>+ إضافة خيار</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <View style={{marginTop: 10}}>
                    <ThemedText style={styles.label}>الإجابة النموذجية (اختياري):</ThemedText>
                    <TextInput
                      style={[styles.input, { height: 80 }]}
                      placeholder="أدخل نص الإجابة الصحيحة لتظهر للطالب لاحقاً"
                      value={q.correctAnswerText}
                      onChangeText={(text) => updateQuestionAnswerText(qIndex, text)}
                      placeholderTextColor="#666"
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </View>
            ))}

            <Pressable style={styles.addQuestionBtn} onPress={addQuestion}>
              <ThemedText style={styles.addQuestionBtnText}>+ إضافة سؤال جديد</ThemedText>
            </Pressable>

            <Pressable 
              style={styles.submitButton} 
              onPress={handleSaveQuiz}
              disabled={createQuiz.isPending}
            >
              {createQuiz.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>{editingId ? "تحديث الاختبار" : "حفظ الاختبار"}</ThemedText>
              )}
            </Pressable>
          </ThemedView>
        )}

        {!isAdding && selectedSubjectId && (
          <View style={styles.list}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              quizzes?.map((quiz) => (
                <ThemedView key={quiz.id} style={styles.quizCard}>
                  <View style={styles.quizCardHeader}>
                    <View style={styles.actions}>
                      <Pressable onPress={() => handleDelete(quiz.id)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </Pressable>
                    </View>
                    <View style={{flexDirection: 'row-reverse', alignItems: 'center'}}>
                      <ThemedText type="defaultSemiBold">{quiz.title}</ThemedText>
                      <View style={[styles.typeBadge, { backgroundColor: quiz.type === 'daily' ? '#E0F2FE' : '#FEF3C7' }]}>
                        <ThemedText style={[styles.typeBadgeText, { color: quiz.type === 'daily' ? '#0369A1' : '#92400E' }]}>
                          {typeLabels[quiz.type as keyof typeof typeLabels]}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={styles.quizDesc}>{quiz.description || "لا يوجد وصف"}</ThemedText>
                  {quiz.dayNumber && <ThemedText style={styles.dayInfo}>اليوم: {quiz.dayNumber}</ThemedText>}
                </ThemedView>
              ))
            )}
            {quizzes?.length === 0 && !isLoading && (
              <ThemedText style={styles.emptyText}>لا توجد اختبارات لهذه المادة</ThemedText>
            )}
          </View>
        )}
      </ScrollView>

      {/* Subject Picker Modal */}
      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>اختر المادة</ThemedText>
            <FlatList
              data={subjects}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.modalItem} 
                  onPress={() => {
                    setSelectedSubjectId(item.id);
                    setShowSubjectPicker(false);
                  }}
                >
                  <ThemedText>{item.name}</ThemedText>
                </Pressable>
              )}
            />
            <Pressable style={styles.modalClose} onPress={() => setShowSubjectPicker(false)}>
              <ThemedText style={styles.modalCloseText}>إغلاق</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Type Picker Modal */}
      <Modal visible={showTypePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>نوع الاختبار</ThemedText>
            {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((t) => (
              <Pressable 
                key={t} 
                style={styles.modalItem} 
                onPress={() => {
                  setType(t);
                  if (t === "daily") {
                    // Force questions to be multiple choice if switching to daily
                    setQuestions(questions.map(q => ({...q, questionType: "multiple_choice"})));
                  }
                  setShowTypePicker(false);
                }}
              >
                <ThemedText>{typeLabels[t]}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Question Type Picker Modal */}
      <Modal visible={!!showQuestionTypePicker?.show} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>نوع السؤال</ThemedText>
            {(Object.keys(qTypeLabels) as Array<keyof typeof qTypeLabels>).map((qt) => (
              <Pressable 
                key={qt} 
                style={styles.modalItem} 
                onPress={() => setQuestionType(showQuestionTypePicker!.qIndex, qt)}
              >
                <ThemedText>{qTypeLabels[qt]}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addButton: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#6B7280",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  selector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectorText: {
    textAlign: 'right',
    fontSize: 16,
  },
  placeholderText: {
    textAlign: 'right',
    fontSize: 16,
    color: '#999',
  },
  form: {
    padding: 16,
    backgroundColor: '#fff',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
    fontSize: 16,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fcfcfc',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  qTypeBadge: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qTypeBadgeText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioActive: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  addOptionBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  addOptionBtnText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  addQuestionBtn: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  addQuestionBtnText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  quizCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  quizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  quizDesc: {
    color: '#666',
    textAlign: 'right',
    fontSize: 14,
  },
  dayInfo: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  modalClose: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontWeight: 'bold',
    color: '#666',
  }
});
