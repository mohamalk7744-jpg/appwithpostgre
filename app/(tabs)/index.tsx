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

  const { data: stats, isLoading: statsLoading, refetch } = trpc.users.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== 'admin',
    retry: 1
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else if (user?.role === 'admin') {
        router.replace('/admin');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (user?.role === 'admin') {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={{ marginTop: 10 }}>جاري الانتقال لوحة التحكم...</ThemedText>
      </ThemedView>
    );
  }

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

  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <ScrollView 
      style={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.container}>
        {/* Header with New Branding Look */}
        <View style={[styles.header, { borderBottomColor: tintColor + '20' }]}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeText}>
              <ThemedText type="title" style={[styles.title, { color: tintColor }]}>خطِّطها</ThemedText>
              <ThemedText style={styles.subtitle}>أهلاً بك، {user?.name?.split(' ')[0] || 'الطالب'}</ThemedText>
            </View>
            <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '10' }]}>
              <Ionicons name="school" size={40} color={tintColor} />
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: tintColor + '10' }]}>
              <Ionicons name="book" size={24} color={tintColor} />
              <ThemedText style={[styles.statNumber, { color: tintColor }]}>{displayStats.lessonsToday}</ThemedText>
              <ThemedText style={styles.statLabel}>دروس اليوم</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fdf4ff' }]}>
              <Ionicons name="flash" size={24} color="#a855f7" />
              <ThemedText style={[styles.statNumber, { color: '#a855f7' }]}>{displayStats.quizzesToday}</ThemedText>
              <ThemedText style={styles.statLabel}>تحديات</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="gift" size={24} color="#22c55e" />
              <ThemedText style={[styles.statNumber, { color: '#22c55e' }]}>{displayStats.newDiscounts}</ThemedText>
              <ThemedText style={styles.statLabel}>عروض</ThemedText>
            </View>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <ThemedText type="defaultSemiBold">إنجازك في المنهج</ThemedText>
            <ThemedText style={[styles.progressPercentText, { color: tintColor }]}>{progressPercent}%</ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: tintColor,
                }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressDetailText}>
            أكملت {displayStats.completedLessons} من {displayStats.totalLessons} هدف تعليمي
          </ThemedText>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🚀 ابدأ الآن
          </ThemedText>
          
          <Pressable
            style={[styles.actionButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/(tabs)/schedule')}
          >
            <ThemedText style={styles.actionButtonText}>📅 خطة اليوم</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#6366f1' }]}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <ThemedText style={styles.actionButtonText}>🤖 المساعد الذكي</ThemedText>
          </Pressable>

          <View style={{flexDirection: 'row', gap: 10}}>
             <Pressable
                style={[styles.actionButton, { backgroundColor: '#ec4899', flex: 1 }]}
                onPress={() => router.push('/(tabs)/discounts')}
              >
                <ThemedText style={styles.actionButtonText}>🎁 عروض</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: '#f59e0b', flex: 1 }]}
                onPress={() => router.push('/(tabs)/exams')}
              >
                <ThemedText style={styles.actionButtonText}>📝 اختبارات</ThemedText>
              </Pressable>
          </View>
        </View>

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
  scrollContainer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  header: { marginBottom: 24, backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderBottomWidth: 4 },
  headerContent: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { alignItems: 'flex-end' },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'right' },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { marginBottom: 24 },
  statsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 10 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 22, fontWeight: '900', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '700' },
  progressCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 24, elevation: 2 },
  progressHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  progressPercentText: { fontSize: 18, fontWeight: '900' },
  progressBar: { height: 10, borderRadius: 5, backgroundColor: '#f1f1f1', overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressDetailText: { fontSize: 12, color: '#6B7280', textAlign: 'right' },
  actionsContainer: { marginBottom: 24 },
  sectionTitle: { marginBottom: 15, textAlign: 'right', fontWeight: '800' },
  actionButton: { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', elevation: 2 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  logoutButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#fef2f2', alignItems: 'center', marginTop: 16 },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  spacer: { height: 20 },
});