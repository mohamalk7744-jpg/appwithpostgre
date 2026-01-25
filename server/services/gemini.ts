
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

/**
 * دالة لإرسال سؤال لموديل Gemini والحصول على إجابة تعليمية رصينة مرتبطة بالمنهاج
 */
export async function askGemini(question: string, curriculum: string = ""): Promise<string> {
  try {
    // تهيئة الـ AI باستخدام مفتاح API من البيئة (حصرياً API_KEY)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // إعداد تعليمات صارمة للموديل ليلتزم بدور المعلم والمنهج
    const systemInstruction = `
      أنت "مساعد خطِّطها التعليمي"، معلم خبير وذكي.
      مهمتك: الإجابة على أسئلة الطلاب بناءً على المنهج الدراسي المتوفر أدناه فقط.
      ---
      المنهج الدراسي المعتمد:
      ${curriculum || "لم يتم تزويدك بمنهج محدد، أجب بأسلوب تعليمي عام ولكن شجع الطالب على سؤال الإدارة عن المنهج."}
      ---
      
      قواعد صارمة للإجابة:
      1. لغة الإجابة: العربية الفصحى البسيطة والمحببة للطلاب.
      2. دقة المعلومات: التزم بالمعلومات الواردة في المنهج أعلاه. إذا لم تجد الإجابة فيه، قل "هذا الجزء غير مذكور بالتفصيل في منهجنا الحالي، ولكن بشكل عام..." ثم أعطِ لمحة بسيطة.
      3. التنسيق: استخدم النقاط (Bullet points) والرموز التعبيرية التعليمية لتسهيل القراءة على الجوال.
      4. التفاعل: في نهاية كل إجابة، اطرح سؤالاً قصيراً يحفز الطالب على التفكير في النقطة القادمة.
      5. الهوية: لا تذكر أبداً أنك نموذج لغوي أو ذكاء اصطناعي، أنت معلم في مدرسة "خطِّطها".
    `.trim();

    // تنفيذ الاستدعاء باستخدام Gemini 3 Flash (الأسرع والأفضل للمهام النصية)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5, // تقليل درجة الإبداع لزيادة الدقة في المنهج
        topP: 0.8,
        maxOutputTokens: 1000,
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      return "عذراً، لم أستطع صياغة إجابة دقيقة الآن. حاول إعادة صياغة سؤالك.";
    }

    return resultText;
  } catch (error: any) {
    console.error("Gemini Connection Error:", error);
    
    // معالجة أخطاء مفتاح الـ API أو الاتصال
    if (error.message?.includes("API key")) {
      throw new Error("خطأ في الربط: مفتاح الـ API غير صالح أو غير موجود.");
    }

    return "أواجه صعوبة في الاتصال حالياً، يرجى المحاولة بعد قليل.";
  }
}

/**
 * دالة مساعدة لتلخيص الدروس الطويلة
 */
export async function generateLessonSummary(lessonContent: string, subject: string): Promise<string> {
  const prompt = `بصفتك معلماً، لخص الدرس التالي الخاص بمادة "${subject}" في 5 نقاط رئيسية سهلة الحفظ:\n\n${lessonContent}`;
  return await askGemini(prompt, lessonContent);
}
