import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, View } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function SubjectsScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [numberOfDays, setNumberOfDays] = useState("30");
  const [curriculum, setCurriculum] = useState("");

  const utils = trpc.useUtils();

  const createSubject = trpc.subjects.create.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم إضافة المادة الدراسية بنجاح");
      resetForm();
      utils.subjects.list.invalidate();
    },
    onError: (error) => {
      Alert.alert("خطأ", error.message || "فشل في إضافة المادة");
    }
  });

  const updateSubject = trpc.subjects.update.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم تحديث المادة الدراسية بنجاح");
      resetForm();
      utils.subjects.list.invalidate();
    },
    onError: (error) => {
      Alert.alert("خطأ", error.message || "فشل في تحديث المادة");
    }
  });

  const deleteSubject = trpc.subjects.delete.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم حذف المادة الدراسية بنجاح");
      utils.subjects.list.invalidate();
    },
    onError: (error) => {
      Alert.alert("خطأ", error.message || "فشل في حذف المادة");
    }
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setNumberOfDays("30");
    setCurriculum("");
  };

  const handleAddSubject = () => {
    if (!name.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال اسم المادة");
      return;
    }
    
    const days = parseInt(numberOfDays);
    if (isNaN(days) || days <= 0) {
      Alert.alert("تنبيه", "يرجى إدخال عدد أيام صحيح");
      return;
    }

    if (editingId) {
      updateSubject.mutate({ 
        id: editingId,
        name: name.trim(), 
        description: description.trim(), 
        numberOfDays: days,
        curriculum: curriculum.trim() 
      });
    } else {
      createSubject.mutate({ 
        name: name.trim(), 
        description: description.trim(), 
        numberOfDays: days,
        curriculum: curriculum.trim() 
      });
    }
  };

  const handleEdit = (subject: any) => {
    setEditingId(subject.id);
    setName(subject.name);
    setDescription(subject.description || "");
    setNumberOfDays(subject.numberOfDays.toString());
    setCurriculum(subject.curriculum || "");
    setIsAdding(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "حذف المادة",
      "هل أنت متأكد من رغبتك في حذف هذه المادة؟ سيتم حذف جميع الدروس والاختبارات المرتبطة بها.",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "حذف", 
          style: "destructive",
          onPress: () => deleteSubject.mutate({ id })
        }
      ]
    );
  };

  const { data: subjects, isLoading } = trpc.subjects.list.useQuery();

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">إدارة المواد الدراسية</ThemedText>
        <Pressable 
          style={[styles.addButton, isAdding && styles.cancelButton]} 
          onPress={() => isAdding ? resetForm() : setIsAdding(true)}
        >
          <ThemedText style={styles.addButtonText}>
            {isAdding ? "إلغاء" : "+ إضافة مادة"}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {isAdding && (
        <ThemedView style={styles.form}>
          <ThemedText style={styles.formTitle}>{editingId ? "تعديل مادة" : "إضافة مادة جديدة"}</ThemedText>
          
          <ThemedText style={styles.label}>اسم المادة</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="مثلاً: رياضيات، فيزياء..."
            value={name}
            onChangeText={setName}
            placeholderTextColor="#666"
          />
          
          <ThemedText style={styles.label}>وصف المادة</ThemedText>
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="وصف قصير للمادة"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#666"
          />

          <ThemedText style={styles.label}>عدد أيام المادة</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="مثلاً: 30"
            value={numberOfDays}
            onChangeText={setNumberOfDays}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />

          <ThemedText style={styles.label}>المنهج التعليمي (للبوت الذكي)</ThemedText>
          <TextInput
            style={[styles.input, { height: 120 }]}
            placeholder="اكتب تفاصيل المنهج هنا ليتمكن البوت من الإجابة على أسئلة الطلاب..."
            value={curriculum}
            onChangeText={setCurriculum}
            multiline
            placeholderTextColor="#666"
            textAlignVertical="top"
          />

          <Pressable 
            style={styles.submitButton} 
            onPress={handleAddSubject}
            disabled={createSubject.isPending || updateSubject.isPending}
          >
            {createSubject.isPending || updateSubject.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                {editingId ? "تحديث المادة" : "حفظ المادة"}
              </ThemedText>
            )}
          </Pressable>
        </ThemedView>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} color="#007AFF" />
      ) : (
        <View style={styles.list}>
          {subjects?.map((subject) => (
            <ThemedView key={subject.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => handleEdit(subject)} style={styles.actionIcon}>
                    <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(subject.id)} style={styles.actionIcon}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={styles.subjectName}>{subject.name}</ThemedText>
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{subject.numberOfDays} يوم</ThemedText>
                  </View>
                </View>
              </View>
              <ThemedText type="default" style={styles.cardDesc}>
                {subject.description || "لا يوجد وصف"}
              </ThemedText>
              {subject.curriculum && (
                <View style={styles.curriculumIndicator}>
                  <ThemedText style={styles.curriculumIndicatorText}>✓ المنهج متاح للبوت</ThemedText>
                </View>
              )}
            </ThemedView>
          ))}
          {subjects?.length === 0 && (
            <ThemedText style={styles.emptyText}>لا توجد مواد حالياً</ThemedText>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 24,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: 'transparent',
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
  form: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 12,
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  subjectName: {
    fontSize: 18,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },
  cardDesc: {
    color: '#666',
    textAlign: 'right',
  },
  curriculumIndicator: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row-reverse',
  },
  curriculumIndicatorText: {
    fontSize: 12,
    color: '#059669',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  }
});
