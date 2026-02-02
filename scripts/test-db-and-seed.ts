
import "dotenv/config";
import { getDb } from "../server/db";
import * as authService from "../server/auth-service";

async function main() {
  console.log("Testing database connection...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Not defined");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("Failed to initialize database connection.");
      // Fix: Cast process to any to access exit
      (process as any).exit(1);
    }
    console.log("Database connection successful!");

    console.log("Adding test users...");
    
    // Add Admin
    await authService.createUser({
      openId: "admin_test_001",
      email: "admin@test.com",
      name: "المسؤول التجريبي",
      role: "admin",
    });
    console.log("Admin user added: admin@test.com / password123");

    // Add Student
    await authService.createUser({
      openId: "student_test_001",
      email: "student@test.com",
      name: "الطالب التجريبي",
      role: "user",
    });
    console.log("Student user added: student@test.com / password123");

    console.log("All test users added successfully!");
    // Fix: Cast process to any to access exit
    (process as any).exit(0);
  } catch (error) {
    console.error("Error:", error);
    // Fix: Cast process to any to access exit
    (process as any).exit(1);
  }
}

main();
