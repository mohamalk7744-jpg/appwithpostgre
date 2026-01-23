import { publicProcedure, router } from "./_core/trpc";
import * as authService from "./auth-service";

export const seedRouter = router({
  // API للإضافة السريعة للمستخدمين (للاختبار فقط)
  addTestUsers: publicProcedure.mutation(async () => {
    try {
      // إضافة معلم
      await authService.createUser({
        openId: "teacher_001",
        email: "teacher@example.com",
        name: "أحمد محمود",
        role: "admin",
      });

      // إضافة معلم آخر
      await authService.createUser({
        openId: "teacher_002",
        email: "teacher2@example.com",
        name: "فاطمة علي",
        role: "admin",
      });

      // إضافة طالب
      await authService.createUser({
        openId: "student_001",
        email: "student@example.com",
        name: "محمد أحمد",
        role: "user",
      });

      return {
        success: true,
        message: "Test users added successfully",
        users: [
          { email: "teacher@example.com", role: "admin" },
          { email: "teacher2@example.com", role: "admin" },
          { email: "student@example.com", role: "user" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add users";
      throw new Error(message);
    }
  }),
});
