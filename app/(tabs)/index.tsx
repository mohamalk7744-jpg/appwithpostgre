import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trpc } from '@/lib/trpc';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // جلب البيانات فقط إذا كان المستخدم طالباً
  const { data: stats, isLoading: statsLoading, refetch } = trpc.users.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== 'admin',
    retry: 1
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else if (user?.role === 'admin') {
        // تحويل فوري للأدمن
        router.replace('/admin');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // حماية ضد الصفحة البيضاء: إذا كان جاري التحميل، نعرض مؤشر
  if (authLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  // إذا كان أدمن، لا تعرض محتوى الطلاب (سيتم التحويل)
  if (user?.role === 'admin') {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={{ marginTop: 10 }}>جاري الانتقال لوحة التحكم...</ThemedText>
      </ThemedView>
    );
  }

  // قيم افتراضية حتى لو لم تكتمل البيانات بعد لضمان عدم ظهور صفحة بيضاء
  const displayStats = {
    totalLessons: stats?.totalLessons || 0,
    completedLessons: stats?.completedLessons || 0,
    lessonsToday: stats?.lessonsToday || 0,
    quizzesToday: stats?.quizzesToday || 0,
    newDiscounts: stats?.newDiscounts || 0,
  };

  const progressPercent = displayStats.totalLessons > 0 
    ? Math.round((displayStats.completedLessons / displayStats.totalLessons) * 100) 
    : 0;

  return (
    <ScrollView 
      style={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeText}>
              <ThemedText type="title" style={styles.title}>أهلاً، {user?.name?.split(' ')[0] || 'الطالب'}</ThemedText>
              <ThemedText style={styles.subtitle}>استمر في رحلتك التعليمية اليوم</ThemedText>
            </View>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle" size={60} color={Colors[colorScheme ?? 'light'].tint} />
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="book" size={24} color="#4F46E5" />
              <ThemedText style={[styles.statNumber, { color: '#4F46E5' }]}>{displayStats.lessonsToday}</ThemedText>
              <ThemedText style={styles.statLabel}>دروس اليوم</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="document-text" size={24} color="#EA580C" />
              <ThemedText style={[styles.statNumber, { color: '#EA580C' }]}>{displayStats.quizzesToday}</ThemedText>
              <ThemedText style={styles.statLabel}>اختبارات</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="gift" size={24} color="#16A34A" />
              <ThemedText style={[styles.statNumber, { color: '#16A34A' }]}>{displayStats.newDiscounts}</ThemedText>
              <ThemedText style={styles.statLabel}>عروض</ThemedText>
            </View>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <ThemedText type="defaultSemiBold">تقدمك الدراسي الإجمالي</ThemedText>
            <ThemedText style={styles.progressPercentText}>{progressPercent}%</ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: Colors[colorScheme ?? 'light'].tint,
                }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressDetailText}>
            أكملت {displayStats.completedLessons} من أصل {displayStats.totalLessons} درس بنجاح
          </ThemedText>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ⚡ إجراءات سريعة
          </ThemedText>
          
          <Pressable
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => router.push('/(tabs)/schedule')}
          >
            <ThemedText style={styles.actionButtonText}>📚 درس اليوم</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <ThemedText style={styles.actionButtonText}>💬 اسأل البوت</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#34C759' }]}
            onPress={() => router.push('/(tabs)/discounts')}
          >
            <ThemedText style={styles.actionButtonText}>🎉 عروض خاصة</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => router.push('/(tabs)/exams')}
          >
            <ThemedText style={styles.actionButtonText}>✏️ الاختبارات</ThemedText>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          style={styles.logoutButton}
          onPress={logout}
        >
          <ThemedText style={styles.logoutText}>تسجيل الخروج</ThemedText>
        </Pressable>

        <View style={styles.spacer} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressPercentText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#007AFF',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressDetailText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'right',
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
