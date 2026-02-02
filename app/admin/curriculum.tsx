
import { useState } from "react";
import { StyleSheet, ScrollView, View, TextInput, Pressable, Alert, ActivityIndicator, Linking } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function CurriculumScreen() {
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [curriculum, setCurriculum] = useState("");
  const [curriculumUrl, setCurriculumUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: subjects, isLoading: loadingSubjects, refetch } = trpc.subjects.list.useQuery();
  const updateCurriculum = trpc.subjects.update.useMutation();
  
  const handlePickDocument = async () => {
    try {
      const permissions = await (FileSystem as any).StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setIsUploading(true);

      // قراءة الملف بالكامل كـ base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });

      // الإصلاح: حفظ كامل المحتوى وليس الـ 500 حرف الأولى فقط
      setCurriculumUrl(`data:application/pdf;base64,${base64}`);
      Alert.alert("نجاح", "تم اختيار ملف المنهج بنجاح. اضغط على 'حفظ وتحديث' لاعتماده في البوت الذكي.");
    } catch (error) {
      console.error(error);
      Alert.alert("خطأ", "فشل الوصول للملفات. يرجى التأكد من منح التطبيق صلاحية الوصول للتخزين.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSubject) {
      Alert.alert("خطأ", "يرجى اختيار مادة أولاً");
      return;
    }

    setIsSaving(true);
    try {
      await updateCurriculum.mutateAsync({
        id: selectedSubject.id,
        curriculum: curriculum,
        curriculumUrl: curriculumUrl || undefined,
      });
      await refetch();
      Alert.alert("نجاح", "تم حفظ وتحديث المنهج. البوت الذكي جاهز الآن للإجابة على الأسئلة بناءً على الملف المرفوع.");
    } catch (error) {
      console.error(error);
      Alert.alert("خطأ", "فشل حفظ البيانات. تأكد من جودة الاتصال بالإنترنت.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">إدارة المناهج (البوت الذكي)</ThemedText>
        <ThemedText style={styles.subtitle}>أدخل محتوى المنهج لتدريب البوت على مادة {selectedSubject?.name || ''}</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedText style={styles.label}>1. اختر المادة الدراسية:</ThemedText>
        {loadingSubjects ? (
          <ActivityIndicator size="small" color="#7c3aed" />
        ) : (
          <View style={styles.subjectsGrid}>
            {subjects?.map((subject) => (
              <Pressable
                key={subject.id}
                style={[
                  styles.subjectCard,
                  selectedSubject?.id === subject.id && styles.selectedCard
                ]}
                onPress={() => {
                  setSelectedSubject(subject);
                  setCurriculum(subject.curriculum || "");
                  setCurriculumUrl(subject.curriculumUrl || null);
                }}
              >
                <ThemedText style={[
                  styles.subjectName,
                  selectedSubject?.id === subject.id && styles.selectedText
                ]}>
                  {subject.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {selectedSubject && (
          <View style={styles.inputArea}>
            <ThemedText style={styles.label}>2. رفع ملف المنهج (PDF):</ThemedText>
            <View style={styles.uploadSection}>
              {curriculumUrl ? (
                <View style={styles.fileInfo}>
                  <Ionicons name="document-text" size={24} color="#7c3aed" />
                  <View style={styles.fileDetails}>
                    <ThemedText style={styles.fileName}>تم رفع ملف المنهج</ThemedText>
                    <ThemedText style={{fontSize: 10, color: '#10B981'}}>الملف متاح حالياً للبوت</ThemedText>
                  </View>
                  <Pressable onPress={() => setCurriculumUrl(null)} style={styles.removeFile}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              ) : (
                <Pressable 
                  style={[styles.uploadButton, isUploading && styles.disabledButton]} 
                  onPress={handlePickDocument}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#7c3aed" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={24} color="#7c3aed" />
                      <ThemedText style={styles.uploadButtonText}>اضغط لرفع ملف PDF للمنهج</ThemedText>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            <ThemedText style={styles.label}>3. أو إضافة محتوى نصي مباشر:</ThemedText>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="اكتب هنا ملخصاً للمنهج أو معلومات إضافية ليستخدمها البوت..."
              value={curriculum}
              onChangeText={setCurriculum}
              textAlignVertical="top"
            />
            
            <Pressable 
              style={[styles.saveButton, (isSaving || isUploading) && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <ThemedText style={styles.saveButtonText}>حفظ وتحديث المنهج</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { padding: 24, paddingTop: 40, backgroundColor: "#fff", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  subtitle: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  content: { padding: 16 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 12, textAlign: "right" },
  subjectsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  subjectCard: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  selectedCard: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  subjectName: { fontSize: 14, color: "#4B5563" },
  selectedText: { color: "#fff", fontWeight: "bold" },
  inputArea: { marginTop: 8 },
  textInput: { backgroundColor: "#fff", borderRadius: 16, padding: 16, height: 200, borderWidth: 1, borderColor: "#E5E7EB", textAlign: "right", fontSize: 14, lineHeight: 22 },
  saveButton: { backgroundColor: "#10B981", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, marginTop: 16, gap: 8 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  disabledButton: { opacity: 0.6 },
  uploadSection: { marginBottom: 20 },
  uploadButton: { borderWidth: 2, borderColor: "#7c3aed", borderStyle: "dashed", borderRadius: 12, padding: 20, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 10, backgroundColor: "#f5f3ff" },
  uploadButtonText: { color: "#7c3aed", fontWeight: "bold" },
  fileInfo: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", gap: 12 },
  fileDetails: { flex: 1, alignItems: "flex-end" },
  fileName: { fontSize: 14, fontWeight: "bold" },
  removeFile: { padding: 4 }
});
