
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";

async function seedTeachers() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    // Fix: Cast process to any to access exit
    (process as any).exit(1);
  }

  try {
    console.log("Adding teachers to database...");

    // إضافة معلم
    await db.insert(users).values({
      openId: "teacher_001",
      email: "teacher@example.com",
      name: "أحمد محمود",
      loginMethod: "email",
      role: "admin",
      lastSignedIn: new Date(),
    });

    // إضافة معلم آخر
    await db.insert(users).values({
      openId: "teacher_002",
      email: "teacher2@example.com",
      name: "فاطمة علي",
      loginMethod: "email",
      role: "admin",
      lastSignedIn: new Date(),
    });

    // التأكد من وجود الطالب
    await db.insert(users).values({
      openId: "student_001",
      email: "student@example.com",
      name: "محمد أحمد",
      loginMethod: "email",
      role: "user",
      lastSignedIn: new Date(),
    }).catch(() => {
      // قد يكون موجود بالفعل
      console.log("Student already exists");
    });

    console.log("✅ Teachers added successfully!");
    console.log("\nTest accounts:");
    console.log("👨‍🏫 Teacher: teacher@example.com / password123");
    console.log("👨‍🏫 Teacher 2: teacher2@example.com / password123");
    console.log("👨‍🎓 Student: student@example.com / password123");
  } catch (error) {
    console.error("Error seeding teachers:", error);
    // Fix: Cast process to any to access exit
    (process as any).exit(1);
  }
}

seedTeachers();
