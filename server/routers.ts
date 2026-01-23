import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as authService from "./auth-service";
import { seedRouter } from "./seed-router";
import { sdk } from "./_core/sdk";
import { askGemini } from "./services/gemini";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  seed: seedRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input }) => {
        try {
          const user = await authService.authenticateUser(input.email, input.password);
          const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });
          return {
            success: true,
            token,
            user: {
              id: user.id,
              openId: user.openId,
              name: user.name,
              email: user.email,
              role: user.role,
              loginMethod: user.loginMethod,
              lastSignedIn: user.lastSignedIn,
            },
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Login failed";
          throw new Error(message);
        }
      }),
  }),

  storage: router({
    upload: protectedProcedure
      .input(z.object({ base64: z.string(), fileName: z.string(), contentType: z.string().optional() }))
      .mutation(async ({ input }) => {
        // Return the Base64 as a data URI directly
        const mimeType = input.contentType || 'image/jpeg';
        return { url: `data:${mimeType};base64,${input.base64}` };
      }),
  }),

  users: router({
    listStudents: protectedProcedure.query(() => db.getStudents()),
    listAll: protectedProcedure.query(() => db.getAllUsers()),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), role: z.enum(["user", "admin"]).default("user") }))
      .mutation(async ({ input }) => {
        const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await db.upsertUser({ openId, name: input.name, email: input.email, role: input.role, loginMethod: "email", lastSignedIn: new Date() });
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteUser(input.id);
      return { success: true };
    }),
    getStats: protectedProcedure.query(({ ctx }) => db.getStudentStats(ctx.user.id)),
  }),

  subjects: router({
    list: protectedProcedure.query(() => db.getSubjects()),
    listMySubjects: protectedProcedure.query(({ ctx }) => db.getStudentSubjects(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getSubjectById(input.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional(), numberOfDays: z.number().default(30), curriculum: z.string().optional(), curriculumUrl: z.string().optional() }))
      .mutation(({ ctx, input }) => db.createSubject({ ...input, createdBy: ctx.user.id })),
    update: protectedProcedure.input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), numberOfDays: z.number().optional(), curriculum: z.string().optional(), curriculumUrl: z.string().optional() })).mutation(({ input }) => db.updateSubject(input.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteSubject(input.id)),
    listPermissions: protectedProcedure.query(() => db.getPermissions()),
    grantAccess: protectedProcedure.input(z.object({ studentId: z.number(), subjectId: z.number() })).mutation(({ ctx, input }) => db.createAccessPermission({ ...input, hasAccess: 1, createdBy: ctx.user.id })),
    revokeAccess: protectedProcedure.input(z.object({ studentId: z.number(), subjectId: z.number() })).mutation(({ input }) => db.deleteAccessPermission(input.studentId, input.subjectId)),
  }),

  lessons: router({
    listBySubject: protectedProcedure.input(z.object({ subjectId: z.number() })).query(({ input }) => db.getLessonsBySubject(input.subjectId)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getLessonById(input.id)),
    create: protectedProcedure.input(z.object({ subjectId: z.number(), title: z.string().min(1), content: z.string().min(1), dayNumber: z.number().min(1).max(30), order: z.number().default(1) })).mutation(({ ctx, input }) => db.createLesson({ ...input, createdBy: ctx.user.id })),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), dayNumber: z.number().optional(), order: z.number().optional() })).mutation(({ input }) => db.updateLesson(input.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteLesson(input.id)),
  }),

  quizzes: router({
    listBySubject: protectedProcedure.input(z.object({ subjectId: z.number() })).query(({ input }) => db.getQuizzesBySubject(input.subjectId)),
    listBySubjectAndType: protectedProcedure.input(z.object({ subjectId: z.number(), type: z.string() })).query(({ input }) => db.getQuizzesBySubjectAndType(input.subjectId, input.type)),
    listByDay: protectedProcedure.input(z.object({ subjectId: z.number(), dayNumber: z.number() })).query(({ input }) => db.getQuizzesBySubjectAndDay(input.subjectId, input.dayNumber)),
    listAll: protectedProcedure.query(() => db.getAllQuizzes()),
    listExams: protectedProcedure.query(({ ctx }) => db.getStudentExams(ctx.user.id)),
    getDailyForLesson: protectedProcedure.input(z.object({ subjectId: z.number(), dayNumber: z.number() })).query(({ input }) => db.getDailyQuizByLesson(input.subjectId, input.dayNumber)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getFullQuiz(input.id)),
    getExamsWithStatus: protectedProcedure.input(z.object({ quizIds: z.array(z.number()) })).query(({ ctx, input }) => db.getStudentQuizAttempts(ctx.user.id, input.quizIds)),
    getQuizSubmissions: protectedProcedure.input(z.object({ quizId: z.number() })).query(({ input }) => db.getSubmissionsByQuiz(input.quizId)),
    getSubmissionDetails: protectedProcedure.input(z.object({ studentId: z.number(), quizId: z.number() })).query(({ input }) => db.getDetailedSubmission(input.studentId, input.quizId)),
    create: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["daily", "monthly", "semester"]),
        dayNumber: z.number().optional(),
        questions: z.array(z.object({
          question: z.string().min(1),
          questionType: z.enum(["multiple_choice", "short_answer", "essay"]),
          correctAnswerText: z.string().optional(),
          correctAnswerImageUrl: z.string().optional(),
          options: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean() })).optional()
        }))
      }))
      .mutation(({ ctx, input }) => db.createQuiz({ ...input, createdBy: ctx.user.id })),
    submit: protectedProcedure
      .input(z.object({ quizId: z.number(), answers: z.array(z.object({ questionId: z.number(), selectedOptionId: z.number().optional(), textAnswer: z.string().optional(), imageUrl: z.string().optional() })) }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.user.id;
        const quiz = await db.getFullQuiz(input.quizId);
        if (!quiz) throw new Error("الاختبار غير موجود");
        for (const answer of input.answers) {
          let score = null;
          let gradedAt = null;
          const question = quiz.questions.find(q => q.id === answer.questionId);
          if (question && question.questionType === 'multiple_choice' && answer.selectedOptionId) {
            const selectedOption = question.options.find(o => o.id === answer.selectedOptionId);
            score = (selectedOption && selectedOption.isCorrect === 1) ? 1 : 0;
            gradedAt = new Date();
          }
          await db.createStudentAnswer({ ...answer, quizId: input.quizId, studentId, score, gradedAt });
        }
        return { success: true, status: 'submitted' };
      }),
    gradeAnswer: protectedProcedure.input(z.object({ answerId: z.number(), score: z.number(), feedback: z.string().optional() })).mutation(async ({ ctx, input }) => {
      await db.updateStudentAnswer(input.answerId, { ...input, gradedAt: new Date(), gradedBy: ctx.user.id });
      return { success: true };
    }),
    updateQuizModelAnswer: protectedProcedure.input(z.object({ quizId: z.number(), modelAnswerText: z.string().optional(), modelAnswerImageUrl: z.string().optional() })).mutation(async ({ input }) => {
      await db.updateQuiz(input.quizId, input);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteQuiz(input.id);
      return { success: true };
    }),
    publishResults: protectedProcedure.input(z.object({ quizId: z.number() })).mutation(async ({ input }) => {
      await db.updateQuiz(input.quizId, { resultsPublished: 1 });
      return { success: true };
    }),
  }),

  discounts: router({
    list: protectedProcedure.query(() => db.getDiscounts()),
    create: protectedProcedure.input(z.object({ title: z.string().min(1), description: z.string().optional(), discountType: z.enum(["percentage", "fixed"]), discountValue: z.number(), company: z.string().min(1), contactNumber: z.string().optional(), imageUrl: z.string().optional() })).mutation(({ ctx, input }) => db.createDiscount({ ...input, createdBy: ctx.user.id })),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), description: z.string().optional(), discountType: z.enum(["percentage", "fixed"]).optional(), discountValue: z.number().optional(), company: z.string().optional(), contactNumber: z.string().optional(), imageUrl: z.string().optional(), isActive: z.number().optional() })).mutation(({ input }) => db.updateDiscount(input.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteDiscount(input.id)),
  }),

  notifications: router({
    getUserNotifications: protectedProcedure.input(z.object({ userId: z.number() })).query(({ input }) => db.getUserNotifications(input.userId)),
    markAsRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.markNotificationAsRead(input.id)),
  }),

  chat: router({
    ask: protectedProcedure.input(z.object({ subjectId: z.number(), question: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const access = await db.getStudentSubjectAccess(ctx.user.id, input.subjectId);
      if (!access || access.hasAccess === 0) return { answer: "عذراً، لا تملك صلاحية الوصول لهذا المنهج. يرجى الاشتراك في المادة أولاً لتتمكن من سؤال البوت عنها.", success: false };
      const subject = await db.getSubjectById(input.subjectId);
      if (!subject || (!subject.curriculum && !subject.curriculumUrl)) return { answer: "عذراً، لم يتم رفع المنهاج لهذه المادة بعد. سأكون جاهزاً للرد قريباً!", success: false };
      try {
        let curriculum = subject.curriculum || "";
        const answer = await askGemini(input.question, curriculum);
        await db.createChatMessage({ studentId: ctx.user.id, subjectId: input.subjectId, question: input.question, answer: answer });
        return { answer, success: true };
      } catch (error) {
        console.error("Chat error:", error);
        return { answer: "عذراً، حدث خطأ أثناء محاولة الحصول على إجابة من البوت الذكي. يرجى المحاولة لاحقاً.", success: false };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
