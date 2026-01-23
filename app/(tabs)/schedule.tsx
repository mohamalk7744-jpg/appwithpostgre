import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // جلب المواد التي يمتلك الطالب صلاحية الوصول إليها
  const { data: mySubjects, isLoading } = trpc.subjects.listMySubjects.useQuery();

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">الخطة الدراسية</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>المواد المشترك بها</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        {mySubjects && mySubjects.length > 0 ? (
          mySubjects.map((subject) => (
            <Pressable 
              key={subject.id}
              style={({ pressed }) => [
                styles.subjectCard,
                pressed && styles.cardPressed
              ]}
              onPress={() => router.push(`/subject/${subject.id}`)}
            >
              <View style={styles.cardContent}>
                <ThemedText type="subtitle" style={styles.subjectName}>
                  {subject.name}
                </ThemedText>
                <ThemedText type="default" style={styles.subjectDesc}>
                  {subject.description || "لا يوجد وصف لهذه المادة"}
                </ThemedText>
                <View style={styles.metaInfo}>
                  <ThemedText style={styles.metaText}>📅 دورة {subject.numberOfDays} يوم</ThemedText>
                </View>
              </View>
              <View style={styles.arrowContainer}>
                <ThemedText style={styles.arrow}>←</ThemedText>
              </View>
            </Pressable>
          ))
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>لم يتم تفعيل أي مواد لك بعد.</ThemedText>
            <ThemedText style={styles.emptySubtext}>يرجى التواصل مع الإدارة لتفعيل اشتراكك.</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'flex-end',
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    gap: 16,
  },
  subjectCard: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: '#f1f3f5',
  },
  cardContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  subjectName: {
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subjectDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
  },
  metaText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  arrowContainer: {
    paddingRight: 15,
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  }
});
