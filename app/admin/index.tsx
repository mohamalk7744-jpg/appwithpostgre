import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Pressable, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "تسجيل الخروج",
      "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "خروج", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/auth/login");
          }
        }
      ]
    );
  };

  const adminOptions = [
    { title: "إدارة المواد الدراسية", href: "/admin/subjects", icon: "book-outline", color: "#3B82F6" },
    { title: "إدارة الدروس", href: "/admin/lessons", icon: "reader-outline", color: "#10B981" },
    { title: "إدارة الاختبارات", href: "/admin/quizzes", icon: "help-circle-outline", color: "#F59E0B" },
    { title: "إدارة المناهج (البوت)", href: "/admin/curriculum", icon: "chatbubbles-outline", color: "#6366F1" },
    { title: "نتائج واختبارات الطلاب", href: "/admin/results", icon: "stats-chart-outline", color: "#8B5CF6" },
    { title: "إدارة صلاحيات الطلاب", href: "/admin/permissions", icon: "people-outline", color: "#EF4444" },
    { title: "إدارة الخصومات", href: "/admin/discounts", icon: "pricetag-outline", color: "#EC4899" },
    { title: "إدارة المستخدمين", href: "/admin/users", icon: "person-add-outline", color: "#10B981" },
  ];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>لوحة التحكم</ThemedText>
        </View>
        <ThemedText type="default" style={styles.headerSub}>مرحباً بك، يمكنك إدارة كافة محتويات التطبيق من هنا</ThemedText>
      </ThemedView>

      <ThemedView style={styles.optionsContainer}>
        {adminOptions.map((option, index) => (
          <Link key={index} href={option.href as any} asChild>
            <Pressable style={styles.optionButton}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                <Ionicons name={option.icon as any} size={24} color={option.color} />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.optionText}>{option.title}</ThemedText>
              <Ionicons name="chevron-back-outline" size={20} color="#9CA3AF" />
            </Pressable>
          </Link>
        ))}
      </ThemedView>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  headerTitle: {
    fontSize: 28,
    color: '#111827',
    textAlign: 'right',
  },
  headerSub: {
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  optionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  }
});
