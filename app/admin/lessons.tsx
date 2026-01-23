import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, View, Modal, FlatList } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function LessonsScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dayNumber, setDayNumber] = useState("1");

  const utils = trpc.useUtils();
  const { data: subjects } = trpc.subjects.list.useQuery();
  
  const { data: lessons, isLoading, refetch } = trpc.lessons.listBySubject.useQuery(
    { subjectId: selectedSubjectId || 0 },
    { enabled: !!selectedSubjectId }
  );

  const createLesson = trpc.lessons.create.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم إضافة الدرس بنجاح");
      resetForm();
      refetch();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const updateLesson = trpc.lessons.update.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم تحديث الدرس بنجاح");
      resetForm();
      refetch();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const deleteLesson = trpc.lessons.delete.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم حذف الدرس بنجاح");
      refetch();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setDayNumber("1");
  };

  const handleSaveLesson = () => {
    if (!selectedSubjectId || !title || !content) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول واختيار مادة");
      return;
    }

    const lessonData = {
      subjectId: selectedSubjectId,
      title,
      content,
      dayNumber: parseInt(dayNumber),
      order: 1
    };

    if (editingId) {
      updateLesson.mutate({ id: editingId, ...lessonData });
    } else {
      createLesson.mutate(lessonData);
    }
  };

  const handleEdit = (lesson: any) => {
    setEditingId(lesson.id);
    setTitle(lesson.title);
    setContent(lesson.content);
    setDayNumber(lesson.dayNumber.toString());
    setIsAdding(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "حذف الدرس",
      "هل أنت متأكد من رغبتك في حذف هذا الدرس؟",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: () => deleteLesson.mutate({ id }) }
      ]
    );
  };

  const selectedSubject = subjects?.find(s => s.id === selectedSubjectId);

  return (
    <View style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.header}>
          <ThemedText type="title">إدارة الدروس</ThemedText>
          <Pressable 
            style={[styles.addButton, isAdding && styles.cancelButton]} 
            onPress={() => isAdding ? resetForm() : setIsAdding(true)}
          >
            <ThemedText style={styles.addButtonText}>{isAdding ? "إلغاء" : "+ إضافة درس"}</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.label}>المادة الدراسية:</ThemedText>
          <Pressable 
            style={styles.selector} 
            onPress={() => setShowSubjectPicker(true)}
          >
            <ThemedText style={selectedSubject ? styles.selectorText : styles.placeholderText}>
              {selectedSubject ? selectedSubject.name : "اختر مادة من هنا..."}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {isAdding && (
          <ThemedView style={styles.form}>
            <ThemedText style={styles.formTitle}>{editingId ? "تعديل الدرس" : "إضافة درس جديد"}</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="عنوان الدرس"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#666"
            />
            <TextInput
              style={[styles.input, { height: 120 }]}
              placeholder="محتوى الدرس (شرح)"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#666"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="رقم اليوم (مثلاً: 1)"
                value={dayNumber}
                onChangeText={setDayNumber}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
              <ThemedText style={{ marginLeft: 8 }}>اليوم رقم:</ThemedText>
            </View>
            <Pressable 
              style={styles.submitButton} 
              onPress={handleSaveLesson}
              disabled={createLesson.isPending || updateLesson.isPending}
            >
              {(createLesson.isPending || updateLesson.isPending) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>{editingId ? "تحديث الدرس" : "حفظ الدرس"}</ThemedText>
              )}
            </Pressable>
          </ThemedView>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} color="#007AFF" />
        ) : (
          <View style={styles.list}>
            {lessons?.map((lesson) => (
              <ThemedView key={lesson.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.actions}>
                    <Pressable onPress={() => handleEdit(lesson)} style={styles.actionBtn}>
                      <Ionicons name="create-outline" size={20} color="#007AFF" />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(lesson.id)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                  <View style={{flexDirection: 'row-reverse', alignItems: 'center'}}>
                    <ThemedText style={styles.dayBadge}>اليوم {lesson.dayNumber}</ThemedText>
                    <ThemedText type="defaultSemiBold" style={{marginRight: 8}}>{lesson.title}</ThemedText>
                  </View>
                </View>
                <ThemedText numberOfLines={2} style={styles.cardContent}>{lesson.content}</ThemedText>
              </ThemedView>
            ))}
            {selectedSubjectId && lessons?.length === 0 && (
              <ThemedText style={styles.emptyText}>لا توجد دروس لهذه المادة بعد</ThemedText>
            )}
            {!selectedSubjectId && (
              <ThemedText style={styles.emptyText}>الرجاء اختيار مادة لعرض الدروس</ThemedText>
            )}
          </View>
        )}
      </ScrollView>

      {/* مودال اختيار المادة */}
      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>اختر مادة</ThemedText>
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
            <Pressable style={styles.closeButton} onPress={() => setShowSubjectPicker(false)}>
              <ThemedText style={styles.closeButtonText}>إغلاق</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 16, marginBottom: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  addButton: { backgroundColor: "#10B981", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: "#6B7280" },
  addButtonText: { color: "#fff", fontWeight: "600" },
  section: { padding: 16, backgroundColor: '#fff', marginBottom: 10 },
  label: { marginBottom: 8, fontWeight: 'bold', textAlign: 'right' },
  selector: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  selectorText: { textAlign: 'right', color: '#000', fontSize: 16 },
  placeholderText: { textAlign: 'right', color: '#999', fontSize: 16 },
  form: { margin: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12, gap: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  formTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, textAlign: 'right', fontSize: 16 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  submitButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 1, alignItems: 'flex-end' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  dayBadge: { backgroundColor: '#EEF2FF', color: '#4F46E5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12, overflow: 'hidden' },
  cardContent: { color: '#666', fontSize: 14, textAlign: 'right', width: '100%' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  closeButton: { marginTop: 15, padding: 15, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  closeButtonText: { fontWeight: 'bold', color: '#666' }
});
