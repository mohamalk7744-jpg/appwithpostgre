import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AdminLayout() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/auth/login");
      } else if (user?.role !== "admin") {
        // إذا لم يكن مسؤول، يمنع من دخول لوحة التحكم ويوجه لواجهة الطلاب
        router.replace("/(tabs)");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated || user?.role !== "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Admin Dashboard",
        }}
      />
      <Stack.Screen
        name="subjects"
        options={{
          title: "Manage Subjects",
        }}
      />
      <Stack.Screen
        name="lessons"
        options={{
          title: "Manage Lessons",
        }}
      />
      <Stack.Screen
        name="quizzes"
        options={{
          title: "Manage Quizzes",
        }}
      />
      <Stack.Screen
        name="discounts"
        options={{
          title: "Manage Discounts",
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: "إدارة المستخدمين",
        }}
      />
    </Stack>
  );
}
