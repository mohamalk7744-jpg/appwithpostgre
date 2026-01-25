
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

/**
 * دالة لإرسال سؤال لموديل Gemini والحصول على إجابة تعليمية
 */
export async function askGemini(question: string, curriculum: string = ""): Promise<string> {
  try {
    // Correct: Initialize GoogleGenAI using the process.env.API_KEY directly as per guidelines.
    const genAI = new GoogleGenAI(process.env.API_KEY || "");
    
    // استخدام موديل Gemini 1.5 Flash لسرعة الاستجابة وكفاءتها التعليمية
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: curriculum
        ? `أنت مساعد تعليمي خبير. المنهج الدراسي الحالي هو: ${curriculum}. أجب على أسئلة الطلاب بوضوح وبطريقة تعليمية مبسطة ومباشرة باللغة العربية.`
        : "أنت مساعد تعليمي خبير. أجب على أسئلة الطلاب بوضوح وبطريقة تعليمية مبسطة باللغة العربية.",
    });

    const result = await model.generateContent(question);
    const response = await result.response;
    const resultText = response.text();
    
    return resultText || "عذراً، لم أستطع توليد إجابة في الوقت الحالي.";
  } catch (error: any) {
    console.error("Gemini SDK Error:", error.message);
    
    if (error.message?.includes("404")) {
      throw new Error("الموديل المختار غير متاح حالياً، يرجى مراجعة إعدادات الـ API.");
    }
    
    if (error.message?.includes("API key not valid")) {
      throw new Error("مفتاح الـ API غير صالح. يرجى التأكد من صلاحية المفتاح في البيئة.");
    }

    throw new Error("فشل الاتصال بالذكاء الاصطناعي. يرجى المحاولة بعد قليل.");
  }
}

/**
 * دالة لتلخيص محتوى درس تعليمي
 */
export async function generateLessonSummary(lessonContent: string, subject: string): Promise<string> {
  try {
    const prompt = `قم بتلخيص محتوى درس "${subject}" التالي باللغة العربية في نقاط مركزة وسهلة الفهم للطلاب:\n\n${lessonContent}`;
    return await askGemini(prompt);
  } catch (error) {
    console.warn("Summary Generation Failed:", error);
    return "تعذر إنشاء ملخص آلي حالياً.";
  }
}

/**
 * دالة لتوليد أسئلة اختبار بناءً على محتوى الدرس
 */
export async function generateQuizQuestions(lessonContent: string, subject: string, count: number = 5): Promise<string[]> {
  try {
    const prompt = `بناءً على درس "${subject}"، أنشئ ${count} أسئلة خيار من متعدد. اجعل كل سؤال في سطر جديد متبوعاً بالخيارات. المحتوى:\n\n${lessonContent}`;
    const response = await askGemini(prompt);
    return response.split("\n").filter(line => line.trim().length > 10);
  } catch (error) {
    console.warn("Quiz Generation Failed:", error);
    return [];
  }
}
