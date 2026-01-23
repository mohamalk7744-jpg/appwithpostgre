import { integer, pgEnum, pgTable, text, timestamp, varchar, serial, boolean } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").$type<"user" | "admin">().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Subjects (المواد الدراسية)
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: integer("createdBy").notNull(),
  numberOfDays: integer("numberOfDays").notNull().default(30),
  curriculum: text("curriculum"),
  curriculumUrl: text("curriculumUrl"), // Changed to text for Base64
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

// Lessons (الدروس)
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  subjectId: integer("subjectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  dayNumber: integer("dayNumber").notNull(), // اليوم الدراسي (1-30)
  order: integer("order").notNull().default(1),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// Quizzes (الاختبارات)
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  subjectId: integer("subjectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: text("type").$type<"daily" | "monthly" | "semester">().notNull(),
  dayNumber: integer("dayNumber"), // لـ daily quizzes
  scheduledDate: timestamp("scheduledDate"),
  resultsPublished: integer("resultsPublished").default(0), // 0 or 1
  modelAnswerText: text("modelAnswerText"),
  modelAnswerImageUrl: text("modelAnswerImageUrl"), // Changed to text for Base64
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// Quiz Questions (أسئلة الاختبار)
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quizId").notNull(),
  question: text("question").notNull(),
  questionType: text("questionType").$type<"multiple_choice" | "short_answer" | "essay">().notNull(),
  correctAnswerText: text("correctAnswerText"),
  correctAnswerImageUrl: text("correctAnswerImageUrl"), // Changed to text for Base64
  order: integer("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// Quiz Question Options (خيارات الأسئلة)
export const quizOptions = pgTable("quiz_options", {
  id: serial("id").primaryKey(),
  questionId: integer("questionId").notNull(),
  text: text("text").notNull(),
  isCorrect: integer("isCorrect").notNull().default(0), // 0 or 1
  order: integer("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizOption = typeof quizOptions.$inferSelect;
export type InsertQuizOption = typeof quizOptions.$inferInsert;

// Student Answers (إجابات الطلاب)
export const studentAnswers = pgTable("student_answers", {
  id: serial("id").primaryKey(),
  quizId: integer("quizId").notNull(),
  studentId: integer("studentId").notNull(),
  questionId: integer("questionId").notNull(),
  selectedOptionId: integer("selectedOptionId"), // للأسئلة متعددة الخيارات
  textAnswer: text("textAnswer"), // للإجابات النصية
  imageUrl: text("imageUrl"), // Changed to text for Base64
  score: integer("score"), // الدرجة المعطاة
  feedback: text("feedback"), // التعليقات من المعلم
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  gradedAt: timestamp("gradedAt"),
  gradedBy: integer("gradedBy"), // المعلم الذي صحح
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = typeof studentAnswers.$inferInsert;

// Discounts (الحسومات والعروض)
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  discountType: text("discountType").$type<"percentage" | "fixed">().notNull(),
  discountValue: integer("discountValue").notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  contactNumber: varchar("contactNumber", { length: 20 }),
  imageUrl: text("imageUrl"), // Changed to text for Base64
  isActive: integer("isActive").notNull().default(1),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Discount = typeof discounts.$inferSelect;
export type InsertDiscount = typeof discounts.$inferInsert;

// Access Permissions (صلاحيات الوصول)
export const accessPermissions = pgTable("access_permissions", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  subjectId: integer("subjectId").notNull(),
  hasAccess: integer("hasAccess").notNull().default(1), // 0 or 1
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AccessPermission = typeof accessPermissions.$inferSelect;
export type InsertAccessPermission = typeof accessPermissions.$inferInsert;

// Student Progress (تقدم الطالب)
export const studentProgress = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  subjectId: integer("subjectId").notNull(),
  lessonId: integer("lessonId").notNull(),
  isCompleted: integer("isCompleted").notNull().default(0), // 0 or 1
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertStudentProgress = typeof studentProgress.$inferInsert;

// Chat History (سجل الدردشة مع البوت)
export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  subjectId: integer("subjectId").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;

// Notifications (الإشعارات)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: text("type").$type<"lesson" | "quiz" | "discount" | "grade" | "general">().notNull(),
  relatedId: integer("relatedId"),
  isRead: integer("isRead").notNull().default(0), // 0 or 1
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// User Extended
export const usersExtended = pgTable("users_extended", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  userType: text("userType").$type<"student" | "teacher" | "admin">().notNull().default("student"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserExtended = typeof usersExtended.$inferSelect;
export type InsertUserExtended = typeof usersExtended.$inferInsert;
