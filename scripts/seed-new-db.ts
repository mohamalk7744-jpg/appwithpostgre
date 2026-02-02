
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function seed() {
  console.log("🌱 Seeding new database...");

  const db = await getDb();
  if (!db) {
    console.error("❌ Could not connect to database. Check DATABASE_URL.");
    // Fix: Cast process to any to access exit
    (process as any).exit(1);
  }

  try {
    // Check if users already exist
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@test.com"));
    const existingStudent = await db.select().from(users).where(eq(users.email, "student@test.com"));

    if (existingAdmin.length === 0) {
      console.log("Creating admin user...");
      await db.insert(users).values({
        openId: "admin_test_001",
        name: "المسؤول التجريبي",
        email: "admin@test.com",
        password: "password123",
        role: "admin",
        loginMethod: "email",
      });
    } else {
      console.log("Admin user already exists.");
    }

    if (existingStudent.length === 0) {
      console.log("Creating student user...");
      await db.insert(users).values({
        openId: "student_test_001",
        name: "الطالب التجريبي",
        email: "student@test.com",
        password: "password123",
        role: "user",
        loginMethod: "email",
      });
    } else {
      console.log("Student user already exists.");
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    // Fix: Cast process to any to access exit
    (process as any).exit(1);
  }
}

seed();
