import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";

export default function SubjectDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const subjectId = Number(id);

  const { data: subject, isLoading: loadingSubject } = trpc.subjects.getById.useQuery({ id: subjectId });
  const { data: lessons, isLoading: loadingLessons } = trpc.lessons.listBySubject.useQuery({ subjectId });
  const { data: quizzes, isLoading: loadingQuizzes } = trpc.quizzes.listBySubject.useQuery({ subjectId });

  if (loadingSubject || loadingLessons || loadingQuizzes) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  if (!subject) return <ThemedView style={styles.container}><ThemedText>المادة غير موجودة</ThemedText></ThemedView>;

  // تنظيم المحتوى حسب الأيام
  const days = Array.from({ length: subject.numberOfDays || 30 }, (_, i) => i + 1);

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.header}>
          <View style={styles.headerContent}>
             <ThemedText type="title" style={styles.title}>{subject.name}</ThemedText>
             <ThemedText style={styles.description}>{subject.description}</ThemedText>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
               <ThemedText style={styles.statValue}>{lessons?.length || 0}</ThemedText>
               <ThemedText style={styles.statLabel}>درس</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
               <ThemedText style={styles.statValue}>{quizzes?.length || 0}</ThemedText>
               <ThemedText style={styles.statLabel}>اختبار</ThemedText>
            </View>
          </View>
        </ThemedView>

        <View style={styles.contentList}>
          {days.map((day) => {
            const dayLessons = lessons?.filter(l => l.dayNumber === day) || [];
            const dayQuizzes = quizzes?.filter(q => q.dayNumber === day && q.type === 'daily') || [];

            if (dayLessons.length === 0 && dayQuizzes.length === 0) return null;

            return (
              <View key={day} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <View style={styles.line} />
                  <ThemedText style={styles.dayTitle}>اليوم {day}</ThemedText>
                  <View style={styles.line} />
                </View>

                {dayLessons.map((lesson) => (
                  <Pressable 
                    key={`l-${lesson.id}`} 
                    style={styles.card}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                  >
                    <Ionicons name="book-outline" size={24} color="#007AFF" />
                    <View style={styles.cardInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{lesson.title}</ThemedText>
                      <ThemedText style={styles.cardType}>درس تعليمي</ThemedText>
                    </View>
                    <Ionicons name="chevron-back" size={20} color="#ccc" />
                  </Pressable>
                ))}

                {dayQuizzes.map((quiz) => (
                  <Pressable 
                    key={`q-${quiz.id}`} 
                    style={[styles.card, styles.quizCard]}
                    onPress={() => router.push(`/quiz/${quiz.id}`)}
                  >
                    <Ionicons name="help-circle-outline" size={24} color="#e67e22" />
                    <View style={styles.cardInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{quiz.title}</ThemedText>
                      <ThemedText style={styles.cardType}>اختبار تقييمي</ThemedText>
                    </View>
                    <Ionicons name="chevron-back" size={20} color="#ccc" />
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  headerContent: { padding: 25, paddingTop: 40, alignItems: 'center' },
  title: { fontSize: 28, color: '#1a1a1a', marginBottom: 5 },
  description: { color: '#666', textAlign: 'center', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#999' },
  divider: { width: 1, height: 20, backgroundColor: '#eee' },
  contentList: { padding: 20 },
  daySection: { marginBottom: 25 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dayTitle: { marginHorizontal: 15, fontWeight: 'bold', color: '#999', fontSize: 13 },
  line: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  card: { 
    flexDirection: 'row-reverse', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  quizCard: { borderColor: '#ffe8cc', backgroundColor: '#fffcf9' },
  cardInfo: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, color: '#333' },
  cardType: { fontSize: 12, color: '#999', marginTop: 2 },
});
