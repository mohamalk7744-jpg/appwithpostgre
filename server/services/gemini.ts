
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

/**
 * دالة لإرسال سؤال لموديل Gemini والحصول على إجابة تعليمية رصينة مرتبطة بالمنهاج
 */
export async function askGemini(question: string, curriculum: string = "", subjectName: string = "", curriculumUrl?: string): Promise<string> {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY is missing from environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      أنت "مساعد خطِّطها التعليمي الذكي"، معلم خبير متخصص في مادة: (${subjectName}).
      مهمتك الأساسية: الإجابة على أسئلة الطلاب بناءً على المنهج الدراسي المتوفر (سواء كان نصاً أو ملفاً مرفقاً).
      
      --- المنهج الدراسي المكتوب للمادة ---
      ${curriculum || "لم يتم تزويدك بمنهج مكتوب، يرجى مراجعة الملف المرفق إن وجد."}
      ---
      
      قواعد التعامل مع الطالب:
      1. الالتزام بالمنهج: ركز على المعلومات الواردة في المنهج المرفق أو النص المتوفر.
      2. أسلوب الإجابة: استخدم لغة عربية فصحى بسيطة وودودة.
      3. التنسيق التعليمي: استخدم النقاط والعناوين الفرعية لتسهيل الفهم.
      4. الهوية: أنت معلم فخور بالانتماء لمنصة "خطِّطها".
    `.trim();

    // إعداد أجزاء المحتوى (Parts)
    const contents: any[] = [{ text: question }];

    // إذا كان هناك ملف PDF مرفوع بصيغة Base64
    if (curriculumUrl && curriculumUrl.startsWith('data:application/pdf;base64,')) {
      const base64Data = curriculumUrl.split(',')[1];
      contents.unshift({
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest', // استخدام موديل يدعم الملفات
      contents: [{ role: 'user', parts: contents }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      return "عذراً، لم أستطع استنباط إجابة دقيقة من المنهج المتوفر حالياً. حاول صياغة سؤالك بشكل مختلف.";
    }

    return resultText;
  } catch (error: any) {
    console.error("Gemini Connection Error:", error);
    return "أواجه صعوبة في معالجة ملفات المنهج حالياً، يرجى التأكد من أن الملف بصيغة PDF صحيحة أو التواصل مع الدعم الفني.";
  }
}

/**
 * دالة مساعدة لتلخيص محتوى الدروس
 */
export async function generateLessonSummary(lessonContent: string, subject: string): Promise<string> {
  const prompt = `بصفتك معلم مادة ${subject}، قم بتلخيص هذا المحتوى التعليمي في نقاط ذهبية سهلة الحفظ للطلاب:\n\n${lessonContent}`;
  return await askGemini(prompt, lessonContent, subject);
}
