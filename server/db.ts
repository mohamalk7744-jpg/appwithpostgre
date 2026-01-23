import { eq, and, ne, inArray, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  InsertUser,
  users,
  subjects,
  InsertSubject,
  lessons,
  InsertLesson,
  quizzes,
  InsertQuiz,
  discounts,
  InsertDiscount,
  accessPermissions,
  InsertAccessPermission,
  studentProgress,
  InsertStudentProgress,
  chatHistory,
  InsertChatHistory,
  notifications,
  InsertNotification,
  studentAnswers,
  InsertStudentAnswer,
  usersExtended,
  InsertUserExtended,
  quizQuestions,
  InsertQuizQuestion,
  quizOptions,
  InsertQuizOption,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const existingUser = await getUserByOpenId(user.openId);
    if (existingUser) {
      await db.update(users).set({ ...user, lastSignedIn: user.lastSignedIn ?? new Date() }).where(eq(users.openId, user.openId));
    } else {
      await db.insert(users).values({ ...user, role: user.role || (user.openId === ENV.ownerOpenId ? "admin" : "user"), lastSignedIn: user.lastSignedIn || new Date() });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "user"));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

// ==================== Subjects ====================
export async function createSubject(data: InsertSubject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subjects).values(data);
}

export async function getSubjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects);
}

export async function getStudentSubjects(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  const permissions = await db.select({ subjectId: accessPermissions.subjectId }).from(accessPermissions).where(and(eq(accessPermissions.studentId, studentId), eq(accessPermissions.hasAccess, 1)));
  if (permissions.length === 0) return [];
  return db.select().from(subjects).where(inArray(subjects.id, permissions.map(p => p.subjectId)));
}

export async function getSubjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSubject(id: number, data: Partial<InsertSubject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subjects).set(data).where(eq(subjects.id, id));
}

export async function deleteSubject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data
  const relatedQuizzes = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.subjectId, id));
  for (const quiz of relatedQuizzes) {
    await deleteQuiz(quiz.id);
  }
  await db.delete(lessons).where(eq(lessons.subjectId, id));
  await db.delete(accessPermissions).where(eq(accessPermissions.subjectId, id));
  await db.delete(studentProgress).where(eq(studentProgress.subjectId, id));
  await db.delete(chatHistory).where(eq(chatHistory.subjectId, id));
  await db.delete(subjects).where(eq(subjects.id, id));
}

// ==================== Lessons ====================
export async function createLesson(data: InsertLesson) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(lessons).values(data);
}

export async function getLessonsBySubject(subjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(eq(lessons.subjectId, subjectId)).orderBy(lessons.dayNumber);
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(lessons).set(data).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(lessons).where(eq(lessons.id, id));
}

// ==================== Quizzes ====================
export async function createQuiz(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { questions: quizQuestionsData, ...quizData } = data;
  const [newQuiz] = await db.insert(quizzes).values(quizData).returning({ id: quizzes.id });
  const quizId = newQuiz.id;
  if (quizQuestionsData && quizQuestionsData.length > 0) {
    for (let i = 0; i < quizQuestionsData.length; i++) {
      const { options, ...qData } = quizQuestionsData[i];
      const [newQuestion] = await db.insert(quizQuestions).values({ ...qData, quizId, order: i + 1 }).returning({ id: quizQuestions.id });
      if (options && options.length > 0) {
        await db.insert(quizOptions).values(options.map((o: any, oIdx: number) => ({ ...o, questionId: newQuestion.id, isCorrect: o.isCorrect ? 1 : 0, order: oIdx + 1 })));
      }
    }
  }
  return quizId;
}

export async function getQuizzesBySubject(subjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(eq(quizzes.subjectId, subjectId));
}

export async function getQuizzesBySubjectAndType(subjectId: number, type: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(and(eq(quizzes.subjectId, subjectId), eq(quizzes.type, type as any)));
}

export async function getAllQuizzes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes);
}

export async function getNonDailyQuizzes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(ne(quizzes.type, "daily"));
}

export async function getStudentExams(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  const mySubjects = await getStudentSubjects(studentId);
  const subjectIds = mySubjects.map(s => s.id);
  if (subjectIds.length === 0) return [];
  return db.select().from(quizzes).where(and(inArray(quizzes.subjectId, subjectIds), ne(quizzes.type, "daily")));
}

export async function getDailyQuizByLesson(subjectId: number, dayNumber: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(quizzes).where(and(eq(quizzes.subjectId, subjectId), eq(quizzes.type, "daily"), eq(quizzes.dayNumber, dayNumber))).limit(1);
  if (result.length === 0) return null;
  return getFullQuiz(Number(result[0].id));
}

export async function getQuizzesBySubjectAndDay(subjectId: number, dayNumber: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(and(eq(quizzes.subjectId, subjectId), eq(quizzes.dayNumber, dayNumber)));
}

export async function getQuizById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getFullQuiz(quizId: number) {
  const db = await getDb();
  if (!db) return null;
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;
  const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(quizQuestions.order);
  const questionsWithOptions = await Promise.all(questions.map(async (q) => {
    const options = await db.select().from(quizOptions).where(eq(quizOptions.questionId, q.id)).orderBy(quizOptions.order);
    return { ...q, options };
  }));
  return { ...quiz, questions: questionsWithOptions };
}

export async function updateQuiz(id: number, data: Partial<InsertQuiz>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quizzes).set(data).where(eq(quizzes.id, id));
}

export async function deleteQuiz(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const questionsList = await db.select({ id: quizQuestions.id }).from(quizQuestions).where(eq(quizQuestions.quizId, id));
  for (const q of questionsList) {
    await db.delete(quizOptions).where(eq(quizOptions.questionId, q.id));
  }
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
  await db.delete(studentAnswers).where(eq(studentAnswers.quizId, id));
  await db.delete(quizzes).where(eq(quizzes.id, id));
}

// ==================== Student Answers ====================
export async function createStudentAnswer(data: InsertStudentAnswer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(studentAnswers).values(data);
}

export async function getSubmissionsByQuiz(quizId: number) {
  const db = await getDb();
  if (!db) return [];
  const answers = await db.select({ studentId: studentAnswers.studentId, score: studentAnswers.score, studentName: users.name, submittedAt: studentAnswers.submittedAt }).from(studentAnswers).leftJoin(users, eq(studentAnswers.studentId, users.id)).where(eq(studentAnswers.quizId, quizId));
  const attempts = new Map<number, any>();
  for (const row of answers) {
    if (!attempts.has(row.studentId)) {
      attempts.set(row.studentId, { studentId: row.studentId, studentName: row.studentName || "طالب مجهول", submittedAt: row.submittedAt, score: 0, gradedCount: 0, totalQuestions: 0, isGraded: false });
    }
    const attempt = attempts.get(row.studentId);
    attempt.totalQuestions += 1;
    if (row.submittedAt > attempt.submittedAt) attempt.submittedAt = row.submittedAt;
    if (row.score !== null) { attempt.score += (row.score || 0); attempt.gradedCount += 1; attempt.isGraded = true; }
  }
  return Array.from(attempts.values()).map(a => ({ ...a, percentage: a.gradedCount > 0 ? Math.round((a.score / a.gradedCount) * 100) : 0 })).sort((a, b) => b.percentage - a.percentage);
}

export async function getDetailedSubmission(studentId: number, quizId: number) {
  const db = await getDb();
  if (!db) return null;
  const answers = await db.select({ answerId: studentAnswers.id, questionId: studentAnswers.questionId, question: quizQuestions.question, questionType: quizQuestions.questionType, selectedOptionId: studentAnswers.selectedOptionId, textAnswer: studentAnswers.textAnswer, imageUrl: studentAnswers.imageUrl, score: studentAnswers.score, feedback: studentAnswers.feedback, correctAnswerText: quizQuestions.correctAnswerText, correctAnswerImageUrl: quizQuestions.correctAnswerImageUrl }).from(studentAnswers).innerJoin(quizQuestions, eq(studentAnswers.questionId, quizQuestions.id)).where(and(eq(studentAnswers.studentId, studentId), eq(studentAnswers.quizId, quizId)));
  return Promise.all(answers.map(async (ans) => {
    let options = [];
    if (ans.questionType === "multiple_choice") options = await db.select().from(quizOptions).where(eq(quizOptions.questionId, ans.questionId));
    return { ...ans, options };
  }));
}

export async function updateStudentAnswer(id: number, data: Partial<InsertStudentAnswer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studentAnswers).set(data).where(eq(studentAnswers.id, id));
}

export async function getStudentQuizAttempts(studentId: number, quizIds: number[]) {
  const db = await getDb();
  if (!db || quizIds.length === 0) return {};
  const answers = await db.select({ quizId: studentAnswers.quizId, score: studentAnswers.score, submittedAt: studentAnswers.submittedAt, gradedAt: studentAnswers.gradedAt }).from(studentAnswers).where(and(eq(studentAnswers.studentId, studentId), inArray(studentAnswers.quizId, quizIds)));
  const attempts: Record<number, any> = {};
  for (const quizId of quizIds) attempts[quizId] = { hasAttempted: false, isGraded: false, percentage: null, submittedAt: null };
  for (const answer of answers) {
    const quizId = answer.quizId;
    if (!attempts[quizId].hasAttempted) { attempts[quizId].hasAttempted = true; attempts[quizId].submittedAt = answer.submittedAt; }
    if (answer.gradedAt !== null) attempts[quizId].isGraded = true;
    if (answer.score !== null) { if (attempts[quizId].percentage === null) attempts[quizId].percentage = 0; attempts[quizId].percentage += answer.score; }
  }
  return attempts;
}

// ==================== Discounts ====================
export async function createDiscount(data: InsertDiscount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(discounts).values(data);
}

export async function getDiscounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(discounts);
}

export async function updateDiscount(id: number, data: Partial<InsertDiscount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(discounts).set(data).where(eq(discounts.id, id));
}

export async function deleteDiscount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(discounts).where(eq(discounts.id, id));
}

// ==================== Access Permissions ====================
export async function getStudentSubjectAccess(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accessPermissions).where(and(eq(accessPermissions.studentId, studentId), eq(accessPermissions.subjectId, subjectId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createAccessPermission(data: InsertAccessPermission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(accessPermissions).values(data);
}

export async function deleteAccessPermission(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(accessPermissions).where(and(eq(accessPermissions.studentId, studentId), eq(accessPermissions.subjectId, subjectId)));
}

export async function getPermissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: accessPermissions.id, studentId: accessPermissions.studentId, studentName: users.name, subjectId: accessPermissions.subjectId, subjectName: subjects.name, hasAccess: accessPermissions.hasAccess }).from(accessPermissions).leftJoin(users, eq(accessPermissions.studentId, users.id)).leftJoin(subjects, eq(accessPermissions.subjectId, subjects.id));
}

// ==================== Student Progress ====================
export async function updateStudentProgress(data: InsertStudentProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(studentProgress).where(and(eq(studentProgress.studentId, data.studentId), eq(studentProgress.lessonId, data.lessonId))).limit(1);
  if (existing.length > 0) {
    await db.update(studentProgress).set({ isCompleted: data.isCompleted, completedAt: data.isCompleted ? new Date() : null }).where(eq(studentProgress.id, existing[0].id));
  } else {
    await db.insert(studentProgress).values({ ...data, completedAt: data.isCompleted ? new Date() : null });
  }
}

export async function getStudentProgress(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentProgress).where(and(eq(studentProgress.studentId, studentId), eq(studentProgress.subjectId, subjectId)));
}

// ==================== Chat & Notifications ====================
export async function createChatMessage(data: InsertChatHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatHistory).values(data);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
}

export async function getStudentStats(studentId: number) {
  const db = await getDb();
  if (!db) return { lessonsToday: 0, quizzesToday: 0, newDiscounts: 0, completedLessons: 0, totalLessons: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mySubjects = await getStudentSubjects(studentId);
  const subjectIds = mySubjects.map(s => s.id);
  let lessonsToday = 0, totalLessons = 0;
  if (subjectIds.length > 0) {
    const allLessons = await db.select().from(lessons).where(inArray(lessons.subjectId, subjectIds));
    totalLessons = allLessons.length;
    lessonsToday = allLessons.filter(l => l.createdAt >= today).length || 2;
  }
  let quizzesToday = 0;
  if (subjectIds.length > 0) {
    const allQuizzes = await db.select().from(quizzes).where(and(inArray(quizzes.subjectId, subjectIds), or(eq(quizzes.type, "daily"), eq(quizzes.type, "monthly"))));
    const quizIds = allQuizzes.map(q => q.id);
    if (quizIds.length > 0) {
      const attempts = await getStudentQuizAttempts(studentId, quizIds);
      quizzesToday = allQuizzes.filter(q => !attempts[q.id]?.hasAttempted).length;
    }
  }
  const completed = await db.select().from(studentProgress).where(and(eq(studentProgress.studentId, studentId), eq(studentProgress.isCompleted, 1)));
  return { lessonsToday: lessonsToday || 0, quizzesToday: quizzesToday || 0, newDiscounts: 0, completedLessons: completed.length, totalLessons: totalLessons || 1 };
}
