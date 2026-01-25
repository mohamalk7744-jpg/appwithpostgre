import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

/**
 * دالة لإرسال سؤال لموديل Gemini والحصول على إجابة تعليمية رصينة مرتبطة بالمنهاج
 */
export async function askGemini(question: string, curriculum: string = "", subjectName: string = ""): Promise<string> {
  try {
    // التأكد من وجود مفتاح API في البيئة
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY_MISSING: لم يتم العثور على مفتاح API في ملف الإعدادات.");
    }

    // تهيئة الـ AI
    const ai = new GoogleGenAI({ apiKey });
    
    // إعداد تعليمات صارمة للموديل ليلتزم بدور المعلم والمنهج الدراسي المرفوع
    const systemInstruction = `
      أنت "مساعد خطِّطها التعليمي الذكي"، معلم خبير متخصص في مادة: (${subjectName}).
      مهمتك الأساسية: الإجابة على أسئلة الطلاب بناءً على المنهج الدراسي المتوفر أدناه فقط.
      
      --- المنهج الدراسي المعتمد المرفوع من المسؤول ---
      ${curriculum || "لم يتم تزويدك بمنهج محدد بعد لهذه المادة، أجب بأسلوب تعليمي عام وشجع الطالب على الالتزام بالكتاب المدرسي."}
      ---
      
      قواعد صارمة للتعامل مع الطالب:
      1. الالتزام بالمنهج: لا تعطِ معلومات خارجية قد تشتت الطالب، ركز على ما ورد في النص أعلاه.
      2. أسلوب الإجابة: استخدم لغة عربية فصحى بسيطة وودودة.
      3. التنسيق التعليمي: استخدم النقاط والعناوين لتسهيل القراءة على الهاتف.
      4. الصدق: إذا سأل الطالب سؤالاً ليس له إجابة في المنهج المرفق، قل له: "هذا السؤال خارج تفاصيل المنهج المتوفرة لدي حالياً، ولكن يمكنني مساعدتك في المواضيع التالية: [اذكر بعض مواضيع المنهج]".
      5. الهوية: أنت معلم في منصة "خطِّطها" ولست مجرد ذكاء اصطناعي.
    `.trim();

    // استدعاء موديل Gemini 3 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // تقليل درجة الحرارة لزيادة الالتزام بالنص (المنهج)
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      return "عذراً، لم أستطع استنباط إجابة دقيقة من المنهاج. حاول صياغة سؤالك بشكل مختلف.";
    }

    return resultText;
  } catch (error: any) {
    console.error("Gemini Connection Error:", error);
    
    if (error.message?.includes("403") || error.message?.includes("leaked")) {
      return "خطأ: مفتاح الـ API الحالي محظور لأنه مسرب. يرجى من المسؤول تحديث المفتاح في ملف .env.local";
    }

    if (error.message?.includes("API_KEY_MISSING")) {
      return "خطأ: لم يتم ضبط إعدادات الربط بشكل صحيح (نقص API_KEY).";
    }

    return "أواجه صعوبة في الاتصال بخدمات الذكاء الاصطناعي حالياً، يرجى المحاولة لاحقاً.";
  }
}

/**
 * دالة مساعدة لتلخيص محتوى الدروس
 */
export async function generateLessonSummary(lessonContent: string, subject: string): Promise<string> {
  const prompt = `بصفتك معلم مادة ${subject}، قم بتلخيص هذا المحتوى التعليمي في نقاط ذهبية سهلة الحفظ للطلاب:\n\n${lessonContent}`;
  return await askGemini(prompt, lessonContent, subject);
}
