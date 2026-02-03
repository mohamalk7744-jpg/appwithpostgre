
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

/**
 * دالة لإرسال سؤال لموديل Gemini والحصول على إجابة تعليمية رصينة مرتبطة بالمنهاج
 * تم الترقية لنسخة Pro لضمان قراءة ملفات الـ PDF بشكل صحيح
 */
export async function askGemini(question: string, curriculum: string = "", subjectName: string = "", curriculumUrl?: string): Promise<string> {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY is missing from environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      أنت "مساعد خطِّطها التعليمي الذكي"، خبير وأستاذ متخصص في مادة: (${subjectName}).
      
      مهمتك الأساسية هي تحليل المنهاج المرفق (سواء كان نصاً أو ملف PDF) والإجابة على أسئلة الطالب بدقة.
      
      --- تعليمات صارمة ---
      1. اعتمد كلياً على المعلومات الواردة في المنهج المرفق فقط.
      2. إذا سألك الطالب عن شيء غير موجود في المنهج، أخبره بلباقة أن هذا الموضوع خارج نطاق المنهاج المقرر.
      3. استخدم لغة عربية فصحى، بسيطة، ومشجعة.
      4. قدم إجابات منظمة في نقاط إذا لزم الأمر لتسهيل الفهم.
      
      سياق المنهج النصي:
      ${curriculum || "المحتوى الأساسي موجود في ملف الـ PDF المرفق."}
    `.trim();

    const parts: any[] = [];

    // التعامل مع ملف الـ PDF المرفق
    if (curriculumUrl) {
      // التحقق مما إذا كان الرابط عبارة عن Data URL (Base64)
      if (curriculumUrl.startsWith('data:application/pdf;base64,')) {
        const base64Data = curriculumUrl.split('base64,')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        });
      } else {
        // إذا كان رابطاً عادياً (نص إرشادي للموديل)
        parts.push({ text: `يرجى مراجعة محتوى المنهج من المصدر المتاح: ${curriculumUrl}` });
      }
    }

    // إضافة سؤال الطالب
    parts.push({ text: question });

    // استخدام موديل Pro للمهام المعقدة (تحليل ملفات PDF)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2, // درجة حرارة منخفضة جداً لضمان عدم التأليف (Hallucination)
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    return response.text || "عذراً، لم أتمكن من استخراج إجابة من الملف المرفق. يرجى التأكد من أن ملف الـ PDF يحتوي على نصوص قابلة للقراءة وليس صوراً فقط.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "نعتذر منك، أواجه صعوبة تقنية في الوصول للمنهاج حالياً. يرجى المحاولة مرة أخرى أو إبلاغ الإدارة إذا استمرت المشكلة.";
  }
}

/**
 * دالة مساعدة لتلخيص محتوى الدروس
 */
export async function generateLessonSummary(lessonContent: string, subject: string): Promise<string> {
  const prompt = `بصفتك معلم مادة ${subject}، قم بتلخيص هذا المحتوى في نقاط تعليمية سهلة الحفظ وواضحة:\n\n${lessonContent}`;
  return await askGemini(prompt, lessonContent, subject);
}
