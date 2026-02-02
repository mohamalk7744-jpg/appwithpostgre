
import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Auth from '@/lib/auth';
import { trpc } from '@/lib/trpc';
import { KhatthaLogo } from '@/components/khattha-logo';

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
        await Auth.setSessionToken(result.token || 'session_' + Date.now());

        if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل تسجيل الدخول';
      Alert.alert('خطأ', message);
      setLoading(false);
    }
  };

  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <ThemedView style={styles.container}>
      {/* Background Decor */}
      <View style={styles.bgCircle} />
      <View style={[styles.bgCircle, styles.bgCircleSmall]} />
      
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <KhatthaLogo size={220} color={tintColor} />
          <ThemedText type="title" style={[styles.logoTitle, { color: tintColor }]}>
            خطِّطها
          </ThemedText>
          <ThemedText style={styles.tagline}>
            منصة "خطِّطها" للتعليم الذكي
          </ThemedText>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={[styles.input, { borderColor: tintColor + '20', color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="البريد الإلكتروني"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textAlign="right"
          />
          <TextInput
            style={[styles.input, { borderColor: tintColor + '20', color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="كلمة المرور"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <Pressable
            style={[styles.loginBtn, { backgroundColor: tintColor }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.loginBtnText}>دخول للمنصة</ThemedText>
            )}
          </Pressable>
        </View>

        <ThemedText style={styles.footer}>© 2026 جميع الحقوق محفوظة لخطِّطها</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  bgCircle: { position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: '#7c3aed08' },
  bgCircleSmall: { top: '60%', left: -150, width: 300, height: 300, backgroundColor: '#7c3aed05' },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoTitle: { fontSize: 44, fontWeight: '900', marginTop: -15 },
  tagline: { fontSize: 15, color: '#6B7280', fontWeight: 'bold', marginTop: 5 },
  formCard: { gap: 15, backgroundColor: '#fff', padding: 20, borderRadius: 25, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  input: { borderWidth: 1.5, borderRadius: 15, padding: 18, fontSize: 16, backgroundColor: '#fdfdfd' },
  loginBtn: { paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#aaa' }
});
