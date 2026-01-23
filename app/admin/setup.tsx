import { useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trpc } from '@/lib/trpc';

export default function SetupScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const seedMutation = trpc.seed.addTestUsers.useMutation();

  const handleAddUsers = async () => {
    setLoading(true);
    try {
      const result = await seedMutation.mutateAsync();
      
      Alert.alert(
        'نجح! ✅',
        `تم إضافة المستخدمين بنجاح!\n\n${result.users?.map((u: any) => `${u.email} (${u.role})`).join('\n')}`
      );
      
      // العودة للصفحة الرئيسية
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل إضافة المستخدمين';
      Alert.alert('خطأ', message);
      console.error('Setup error:', error);
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          إعداد التطبيق
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          يرجى إضافة بيانات الاختبار أولاً
        </ThemedText>

        <View style={styles.info}>
          <ThemedText style={styles.infoTitle}>سيتم إضافة:</ThemedText>
          <ThemedText style={styles.infoText}>👨‍🏫 معلم: teacher@example.com</ThemedText>
          <ThemedText style={styles.infoText}>👨‍🏫 معلم: teacher2@example.com</ThemedText>
          <ThemedText style={styles.infoText}>👨‍🎓 طالب: student@example.com</ThemedText>
        </View>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: Colors[colorScheme ?? 'light'].tint },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleAddUsers}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>
              إضافة بيانات الاختبار
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          style={styles.skipButton}
          onPress={() => router.replace('/admin')}
          disabled={loading}
        >
          <ThemedText style={styles.skipText}>
            تخطي
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    gap: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  info: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    opacity: 0.7,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
