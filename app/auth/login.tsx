import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Auth from '@/lib/auth';
import { trpc } from '@/lib/trpc';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password: password.trim(),
      });

      if (result.success && result.user) {
        const user = result.user;
        
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
        
        if (result.token) {
          await Auth.setSessionToken(result.token);
        } else {
          await Auth.setSessionToken('session_' + Date.now());
        }

        setTimeout(() => {
          if (user.role === 'admin') {
            router.replace('/admin');
          } else {
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

  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* New Logo Placeholder Inspired by Provided Image */}
        <View style={styles.logoContainer}>
          <View style={[styles.iconCircle, { backgroundColor: tintColor }]}>
            <Ionicons name="school" size={60} color="#fff" />
          </View>
          <ThemedText type="title" style={[styles.logoText, { color: tintColor }]}>
            خطِّطها
          </ThemedText>
          <ThemedText style={styles.tagline}>
            طريقك نحو التفوق والنجاح
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>البريد الإلكتروني</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: tintColor + '40',
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: tintColor + '05',
                }
              ]}
              placeholder="أدخل بريدك الإلكتروني"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>كلمة المرور</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: tintColor + '40',
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: tintColor + '05',
                }
              ]}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              secureTextEntry
              textAlign="right"
            />
          </View>

          <Pressable
            style={[
              styles.loginButton,
              { backgroundColor: tintColor },
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.loginButtonText}>
                دخول للمنصة
              </ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            بواسطة شركة خطِّطها للحلول البرمجية
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  content: { gap: 40 },
  logoContainer: { alignItems: 'center', gap: 10 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 20 },
  logoText: { fontSize: 36, fontWeight: '900', marginTop: 10 },
  tagline: { fontSize: 14, color: '#6B7280', opacity: 0.8 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginRight: 5 },
  input: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15, fontSize: 16 },
  loginButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#999', opacity: 0.6 }
});