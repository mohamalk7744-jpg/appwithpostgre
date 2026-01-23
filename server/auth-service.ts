import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb, upsertUser } from "./db";

/**
 * التحقق من بيانات تسجيل الدخول وإرجاع بيانات المستخدم مع الدور
 */
export async function authenticateUser(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // البحث عن المستخدم بالبريد الإلكتروني
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result[0];

  // في الواقع، يجب التحقق من كلمة المرور المشفرة
  // هنا نستخدم كلمة مرور بسيطة للاختبار
  if (password !== "password123") {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    role: user.role,
    lastSignedIn: user.lastSignedIn,
  };
}

/**
 * الحصول على المستخدم بواسطة البريد الإلكتروني
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * الحصول على دور المستخدم
 */
export async function getUserRole(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0].role : null;
}

/**
 * إنشاء مستخدم جديد أو تحديثه إذا كان موجوداً
 */
export async function createUser(data: {
  openId: string;
  email: string;
  name?: string;
  role?: "user" | "admin";
}) {
  await upsertUser({
    openId: data.openId,
    email: data.email,
    name: data.name,
    role: data.role || "user",
    lastSignedIn: new Date(),
  });
}

/**
 * تحديث دور المستخدم
 */
export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}
