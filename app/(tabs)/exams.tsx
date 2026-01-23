import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function ExamsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // جلب الاختبارات الفصلية والمنتهية فقط (غير اليومية)
  const { data: quizzes, isLoading, refetch } = trpc.quizzes.listExams.useQuery();
  
  // جلب معرفات الاختبارات
  const quizIds = quizzes?.map(q => q.id) || [];
  
  // جلب حالة الاختبارات للطالب
  const { data: quizStatus } = trpc.quizzes.getExamsWithStatus.useQuery(
    { quizIds },
    { enabled: quizIds.length > 0 }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "monthly": return "اختبار شهري";
      case "semester": return "اختبار فصلي";
      default: return type;
    }
  };

  const getStatusBadge = (quizId: number) => {
    const status = quizStatus?.[quizId];
    
    if (!status?.hasAttempted) {
      return null;
    }
    
    if (status.isGraded && status.percentage !== null) {
      return (
        <View style={[styles.statusBadge, styles.gradedBadge]}>
          <Ionicons name="checkmark-circle" size={14} color="#34C759" />
          <ThemedText style={styles.statusBadgeText}>درجة: {status.percentage}%</ThemedText>
        </View>
      );
    }
    
    return (
      <View style={[styles.statusBadge, styles.pendingBadge]}>
        <Ionicons name="time" size={14} color="#F59E0B" />
        <ThemedText style={styles.statusBadgeText}>في انتظار التصحيح</ThemedText>
      </View>
    );
  };

  const getButtonText = (quizId: number, quizType: string) => {
    const status = quizStatus?.[quizId];
    
    // للاختبارات الشهرية والفصلية - لا نسمح بإعادة المحاولة أو المراجعة
    if (quizType === 'monthly' || quizType === 'semester') {
      if (status?.hasAttempted) {
        return "تم الحل";
      }
      return "بدء الاختبار";
    }
    
    // للاختبارات اليومية
    if (!status?.hasAttempted) {
      return "بدء الاختبار";
    }
    
    if (status.isGraded) {
      return "مراجعة الاختبار";
    }
    
    return "إعادة المحاولة";
  };

  const isButtonDisabled = (quizId: number, quizType: string) => {
    const status = quizStatus?.[quizId];
    
    // للاختبارات الشهرية والفصلية - تعطيل الزر بعد الإرسال
    if (quizType === 'monthly' || quizType === 'semester') {
      return status?.hasAttempted;
    }
    
    return false;
  };

  const canOpenQuiz = (quizId: number, quizType: string) => {
    const status = quizStatus?.[quizId];
    
    // إذا كان الاختبار من نوع شهري أو فصلي وقد سبق للطالب حله
    if ((quizType === 'monthly' || quizType === 'semester') && status?.hasAttempted) {
      return false;
    }
    
    // للاختبارات اليومية - يمكن فتحها دائماً
    return true;
  };

  const handleQuizPress = (quizId: number, quizType: string) => {
    if (canOpenQuiz(quizId, quizType)) {
      router.push(`/quiz/${quizId}`);
    } else {
      // إظهار رسالة تنبيه
      Alert.alert(
        "تنبيه",
        "لقد قمت بإتمام هذا الاختبار سابقاً ولا يمكنك إعادة فتحه",
        [{ text: "حسناً" }]
      );
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>الاختبارات الرسمية</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>الاختبارات الشهرية والفصلية لتقييم مستواك</ThemedText>
      </ThemedView>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.examsContainer}>
          {quizzes?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>لا توجد اختبارات شهرية أو فصلية حالياً</ThemedText>
            </View>
          ) : (
            quizzes?.map((quiz) => (
              <Pressable 
                key={quiz.id}
                style={({ pressed }) => [
                  styles.examCard,
                  !canOpenQuiz(quiz.id, quiz.type) && styles.disabledCard,
                  pressed && canOpenQuiz(quiz.id, quiz.type) && styles.examCardPressed
                ]}
                onPress={() => handleQuizPress(quiz.id, quiz.type)}
              >
                <View style={styles.examHeader}>
                  <View style={styles.examInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.examTitle}>
                      {quiz.title}
                    </ThemedText>
                    <ThemedText type="default" style={styles.examType}>
                      {getTypeLabel(quiz.type)}
                    </ThemedText>
                  </View>
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>رسمي</ThemedText>
                  </View>
                </View>

                {quiz.description && (
                  <ThemedText type="default" style={styles.description}>
                    {quiz.description}
                  </ThemedText>
                )}

                {/* عرض حالة الاختبار */}
                {getStatusBadge(quiz.id)}

                <View style={styles.footer}>
                  <ThemedText style={styles.footerText}>
                    📅 {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('ar-EG') : '---'}
                  </ThemedText>
                  <View style={[
                    styles.startButton,
                    isButtonDisabled(quiz.id, quiz.type) && styles.disabledButton,
                    quizStatus?.[quiz.id]?.hasAttempted && !isButtonDisabled(quiz.id, quiz.type) && styles.retryButton
                  ]}>
                    <ThemedText style={[
                      styles.startButtonText,
                      isButtonDisabled(quiz.id, quiz.type) && styles.disabledButtonText
                    ]}>
                      {getButtonText(quiz.id, quiz.type)}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  title: {
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'right',
  },
  examsContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  examCard: {
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  examCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  disabledCard: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  examHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  examInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  examTitle: {
    fontSize: 18,
    color: '#333',
  },
  examType: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#FFE4BC',
  },
  badgeText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 12,
  },
  
  // Status Badge Styles
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  gradedBadge: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 16,
  }
});
