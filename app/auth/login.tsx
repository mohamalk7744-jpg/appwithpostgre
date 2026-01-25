import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Auth from '@/lib/auth';
import { trpc } from '@/lib/trpc';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [email, setEmail] = useState('student@test.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  
  // استخدام tRPC للاتصال بـ API
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      // استدعاء API من السيرفر
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password: password.trim(),
      });

      if (result.success && result.user) {
        const user = result.user;
        
        // حفظ بيانات المستخدم
        const userInfo: Auth.User = {
          id: user.id,
          openId: user.openId,
          name: user.name || '',
          email: user.email || '',
          loginMethod: user.loginMethod || 'email',
          lastSignedIn: new Date(user.lastSignedIn),
          role: user.role as 'user' | 'admin',
        };
        
        await Auth.setUserInfo(userInfo);
        
        // حفظ التوكن الحقيقي المرسل من السيرفر
        if (result.token) {
          await Auth.setSessionToken(result.token);
        } else {
          // Fallback if no token (should not happen with new API)
          await Auth.setSessionToken('session_' + Date.now());
        }

        // التوجيه حسب دور المستخدم
        setTimeout(() => {
          if (user.role === 'admin') {
            // المعلم/المسؤول → صفحة الإعداد
            router.replace('/admin' as any);
          } else {
            // الطالب → التطبيق العادي
            router.replace('/(tabs)');
          }
        }, 500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل تسجيل الدخول';
      Alert.alert('خطأ', message);
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          تسجيل الدخول
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          مرحباً بك في تطبيق خطِّطها
        </ThemedText>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>البريد الإلكتروني</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: Colors[colorScheme ?? 'light'].tint,
                  color: Colors[colorScheme ?? 'light'].text,
                }
              ]}
              placeholder="أدخل بريدك الإلكتروني"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>كلمة المرور</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: Colors[colorScheme ?? 'light'].tint,
                  color: Colors[colorScheme ?? 'light'].text,
                }
              ]}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[
              styles.loginButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.loginButtonText}>
                تسجيل الدخول
              </ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.demoInfo}>
          <ThemedText style={styles.demoTitle}>بيانات تجريبية:</ThemedText>
          <ThemedText style={styles.demoText}>
            👨‍🎓 طالب:
          </ThemedText>
          <ThemedText style={styles.demoText}>
            البريد: student@test.com
          </ThemedText>
          <ThemedText style={styles.demoText}>
            كلمة المرور: password123
          </ThemedText>
          
          <ThemedText style={[styles.demoText, { marginTop: 12 }]}>
            👨‍🏫 مسؤول:
          </ThemedText>
          <ThemedText style={styles.demoText}>
            البريد: admin@test.com
          </ThemedText>
          <ThemedText style={styles.demoText}>
            كلمة المرور: password123
          </ThemedText>
        </View>
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
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
  },
  loginButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoInfo: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    gap: 4,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  demoText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
