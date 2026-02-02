
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, View, Modal, FlatList, TextInput } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function PermissionsScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string | null } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: number; name: string } | null>(null);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const { data: students, isLoading: loadingStudents } = trpc.users.listStudents.useQuery();
  const { data: subjects, isLoading: loadingSubjects } = trpc.subjects.list.useQuery();
  const { data: permissions, isLoading: loadingPermissions } = trpc.subjects.listPermissions.useQuery();

  const grantAccess = trpc.subjects.grantAccess.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم منح الصلاحية بنجاح");
      setIsAdding(false);
      setSelectedStudent(null);
      setSelectedSubject(null);
      utils.subjects.listPermissions.invalidate();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const revokeAccess = trpc.subjects.revokeAccess.useMutation({
    onSuccess: () => {
      Alert.alert("تم", "تم سحب الصلاحية");
      utils.subjects.listPermissions.invalidate();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const handleGrant = () => {
    if (!selectedStudent || !selectedSubject) {
      Alert.alert("تنبيه", "يرجى اختيار الطالب والمادة");
      return;
    }
    grantAccess.mutate({ studentId: selectedStudent.id, subjectId: selectedSubject.id });
  };

  const handleDelete = (studentId: number, subjectId: number) => {
    Alert.alert(
      "تأكيد",
      "هل أنت متأكد من سحب صلاحية الوصول؟",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "نعم، سحب الصلاحية", style: "destructive", onPress: () => revokeAccess.mutate({ studentId, subjectId }) }
      ]
    );
  };

  const getStudentName = (id: number) => students?.find(s => s.id === id)?.name || `طالب #${id}`;
  const getSubjectName = (id: number) => subjects?.find(s => s.id === id)?.name || `مادة #${id}`;

  const filteredPermissions = permissions?.filter(perm => {
    const studentName = getStudentName(perm.studentId).toLowerCase();
    return studentName.includes(searchQuery.toLowerCase());
  });

  const filteredStudents = students?.filter(student => {
    const name = (student.name || "").toLowerCase();
    const email = (student.email || "").toLowerCase();
    return name.includes(studentSearchQuery.toLowerCase()) || email.includes(studentSearchQuery.toLowerCase());
  });

  if (loadingStudents || loadingSubjects || loadingPermissions) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">صلاحيات الطلاب</ThemedText>
        <Pressable style={styles.addButton} onPress={() => setIsAdding(true)}>
          <ThemedText style={styles.addButtonText}>+ منح صلاحية</ThemedText>
        </Pressable>
      </ThemedView>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث عن اسم الطالب في الصلاحيات..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
      </View>

      <View style={styles.list}>
        {filteredPermissions?.map((perm) => (
          <ThemedView key={perm.id.toString()} style={styles.card}>
            <View style={styles.cardInfo}>
              <ThemedText type="defaultSemiBold">{getStudentName(perm.studentId)}</ThemedText>
              <ThemedText style={styles.subjectTag}>{getSubjectName(perm.subjectId)}</ThemedText>
            </View>
            <Pressable onPress={() => handleDelete(perm.studentId, perm.subjectId)}>
              <ThemedText style={styles.deleteText}>سحب</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
        {permissions?.length === 0 && (
          <ThemedText style={styles.emptyText}>لا توجد صلاحيات ممنوحة حالياً</ThemedText>
        )}
      </View>

      {/* Modal Grant Access */}
      <Modal visible={isAdding} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>منح صلاحية وصول</ThemedText>
            
            <Pressable style={styles.pickerButton} onPress={() => setShowStudentPicker(true)}>
              <ThemedText>{selectedStudent ? selectedStudent.name : "اختر الطالب"}</ThemedText>
            </Pressable>

            <Pressable style={styles.pickerButton} onPress={() => setShowSubjectPicker(true)}>
              <ThemedText>{selectedSubject ? selectedSubject.name : "اختر المادة"}</ThemedText>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable style={styles.saveButton} onPress={handleGrant}>
                <ThemedText style={styles.saveButtonText}>تفعيل الوصول</ThemedText>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setIsAdding(false)}>
                <ThemedText>إلغاء</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>

      {/* Student Picker Modal */}
      <Modal visible={showStudentPicker} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <ThemedView style={styles.pickerContent}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 10 }}>اختر طالباً</ThemedText>
            
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="بحث عن طالب بالاسم أو البريد..."
              value={studentSearchQuery}
              onChangeText={setStudentSearchQuery}
              textAlign="right"
            />

            {/* Use conditional rendering for empty state because FlatList ListEmptyComponent type is missing */}
            {filteredStudents && filteredStudents.length > 0 ? (
              <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable style={styles.pickerItem} onPress={() => {
                    setSelectedStudent(item);
                    setShowStudentPicker(false);
                    setStudentSearchQuery("");
                  }}>
                    <ThemedText>{item.name} ({item.email})</ThemedText>
                  </Pressable>
                )}
              />
            ) : (
              <ThemedText style={styles.emptyText}>لا يوجد طلاب مطابقين للبحث</ThemedText>
            )}
            
            <Pressable onPress={() => {
              setShowStudentPicker(false);
              setStudentSearchQuery("");
            }} style={styles.closePicker}>
              <ThemedText>إغلاق</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>

      {/* Subject Picker Modal */}
      <Modal visible={showSubjectPicker} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <ThemedView style={styles.pickerContent}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 10 }}>اختر المادة</ThemedText>
            <FlatList
              data={subjects}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable style={styles.pickerItem} onPress={() => {
                  setSelectedSubject(item);
                  setShowSubjectPicker(false);
                }}>
                  <ThemedText>{item.name}</ThemedText>
                </Pressable>
              )}
            />
            <Pressable onPress={() => setShowSubjectPicker(false)} style={styles.closePicker}>
              <ThemedText>إغلاق</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  header: { marginBottom: 24, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: 'transparent' },
  addButton: { backgroundColor: "#10B981", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  addButtonText: { color: "#fff", fontWeight: "600" },
  list: { gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  cardInfo: { alignItems: 'flex-end' },
  subjectTag: { color: '#007AFF', fontSize: 13, marginTop: 4 },
  deleteText: { color: '#EF4444', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 16, gap: 15 },
  modalTitle: { textAlign: 'center', marginBottom: 10 },
  pickerButton: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, alignItems: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  saveButton: { flex: 2, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', padding: 20, borderRadius: 16, maxHeight: '80%' },
  pickerItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  closePicker: { marginTop: 15, alignItems: 'center', padding: 10 },
  searchContainer: { marginBottom: 16 },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  pickerSearchInput: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' }
});
