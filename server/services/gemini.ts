import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

/**
 * دالة لإرسال سؤال لموديل Gemini والحصول على إجابة تعليمية رصينة مرتبطة بالمنهاج
 */
export async function askGemini(question: string, curriculum: string = "", subjectName: string = ""): Promise<string> {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY is missing from environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      أنت "مساعد خطِّطها التعليمي الذكي"، معلم خبير متخصص في مادة: (${subjectName}).
      مهمتك الأساسية: الإجابة على أسئلة الطلاب بناءً على المنهج الدراسي المتوفر أدناه فقط.
      
      --- المنهج الدراسي المعتمد للمادة ---
      ${curriculum || "لم يتم تزويدك بمنهج محدد بعد، أجب بأسلوب تعليمي عام."}
      ---
      
      قواعد التعامل مع الطالب:
      1. الالتزام بالمنهج: ركز على المعلومات الواردة في المنهج المرفق.
      2. أسلوب الإجابة: استخدم لغة عربية فصحى بسيطة وودودة.
      3. التنسيق التعليمي: استخدم النقاط والعناوين الفرعية.
      4. الهوية: أنت معلم في منصة "خطِّطها".
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      return "عذراً، لم أستطع استنباط إجابة دقيقة. حاول صياغة سؤالك بشكل مختلف.";
    }

    return resultText;
  } catch (error: any) {
    console.error("Gemini Connection Error:", error);
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
