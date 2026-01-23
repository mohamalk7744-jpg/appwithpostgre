import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const lessonId = Number(id);

  const { data: lesson, isLoading: loadingLesson } = trpc.lessons.getById.useQuery({ id: lessonId });
  
  // جلب جميع الاختبارات المرتبطة بهذا اليوم لهذه المادة
  const { data: dayQuizzes, isLoading: loadingQuizzes } = trpc.quizzes.listByDay.useQuery(
    { subjectId: lesson?.subjectId || 0, dayNumber: lesson?.dayNumber || 0 },
    { enabled: !!lesson }
  );

  if (loadingLesson || loadingQuizzes) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  if (!lesson) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>الدرس غير موجود</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView stickyHeaderIndices={[0]}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color="#007AFF" />
          </Pressable>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.dayText}>اليوم {lesson.dayNumber}</ThemedText>
            <ThemedText type="title" style={styles.title}>{lesson.title}</ThemedText>
          </View>
        </ThemedView>

        <View style={styles.contentCard}>
          <ThemedText style={styles.content}>{lesson.content}</ThemedText>
        </View>

        {dayQuizzes && dayQuizzes.length > 0 && (
          <View style={styles.quizSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="extension-puzzle-outline" size={20} color="#e67e22" />
              <ThemedText type="subtitle" style={styles.quizSectionTitle}>اختبارات اليوم</ThemedText>
            </View>
            
            {dayQuizzes.map((quiz) => (
              <Pressable 
                key={quiz.id}
                style={styles.quizCard}
                onPress={() => router.push(`/quiz/${quiz.id}`)}
              >
                <View style={styles.quizIconContainer}>
                  <Ionicons name="help-circle" size={24} color="#e67e22" />
                </View>
                <View style={styles.quizInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.quizTitle}>{quiz.title}</ThemedText>
                  <ThemedText style={styles.quizMeta}>اضغط لبدء التحدي</ThemedText>
                </View>
                <Ionicons name="chevron-back" size={20} color="#e67e22" />
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
  },
  headerInfo: {
    flex: 1,
    marginRight: 15,
    alignItems: 'flex-end',
  },
  dayText: { color: '#007AFF', fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  title: { fontSize: 20, textAlign: 'right', color: '#1a1a1a' },
  contentCard: { 
    margin: 16,
    padding: 20, 
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  content: { fontSize: 16, lineHeight: 28, textAlign: 'right', color: '#333' },
  quizSection: { paddingHorizontal: 16, marginTop: 10 },
  sectionHeader: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    marginBottom: 15,
    paddingHorizontal: 5
  },
  quizSectionTitle: { marginRight: 8, color: '#e67e22', fontSize: 18 },
  quizCard: { 
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffe8cc',
  },
  quizIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#fff9f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  quizInfo: { flex: 1, alignItems: 'flex-end' },
  quizTitle: { fontSize: 16, color: '#444' },
  quizMeta: { fontSize: 12, color: '#999', marginTop: 2 },
});
