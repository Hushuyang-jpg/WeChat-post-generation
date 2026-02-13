import { GoogleGenAI } from "@google/genai";
import { STYLE_PROMPTS } from '../constants';
import { StyleKey } from '../types';

// 获取环境变量中的 API Key
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("未找到 API 密钥，请确保在 .env.local 文件中配置了 GEMINI_API_KEY");
}

// 1. 初始化 AI 实例（使用环境变量）
const ai = new GoogleGenAI({ 
  apiKey: apiKey
  // 如果你实在无法搞定本地全局代理，且有国内反代域名，可以取消下面这行的注释：
  // , httpOptions: { baseUrl: "https://你的反代域名" }
});

// Helper to clean LLM output
const cleanText = (text: string): string => {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  cleaned = cleaned.replace(/```markdown/g, '').replace(/```/g, '');
  return cleaned.trim();
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ... 保持该文件下方其余代码不变 ...

// Helper to enhance image prompts
const getEnhancedImagePrompt = (text: string, styleName: StyleKey | string, isCover: boolean = false): string => {
  let sceneDescription = text;
  let styleKeywords = "";
  
  if (styleName === "权威科普风") {
    styleKeywords = "National Geographic style, professional documentary photography, sharp focus, 8k resolution, highly detailed, cinematic lighting.";
  } else if (styleName === "小红书种草风") {
    styleKeywords = "Lifestyle photography, bright, airy, high saturation, Instagram aesthetic, cozy atmosphere, soft lighting.";
  } else if (styleName === "干货教程风") {
    styleKeywords = "Clean product photography, minimalist, balanced lighting, professional studio shot, neutral background.";
  } else {
    styleKeywords = "Cinematic photography, authentic texture, natural lighting, Fujifilm color grading, masterpiece.";
  }
  
  const shotType = isCover 
    ? "Wide cinematic shot, symmetrical composition, high impact visual." 
    : "Medium shot, depth of field.";

  const composition = "A single full-frame photograph, one continuous image, no borders, no split screen.";
  const cultural = "Authentic Chinese cultural setting, realistic East Asian features if humans are present.";
  const negative = "bad anatomy, deformed, ugly, blurry, low quality, watermark, text, signature, logo, words, letters, alphabet, ui, interface, split screen, collage, grid, comparison, multiple views, borders, frames, speech bubbles, infographics.";

  return `${composition} ${sceneDescription}. ${shotType} ${styleKeywords} ${cultural} --no ${negative}`;
};

export const generateArticleText = async (topic: string, styleName: StyleKey, wordCount: number) => {
  const styleDesc = STYLE_PROMPTS[styleName] || "通用风格";
  
  const prompt = `
    【你的绝对核心身份】：你是一名为微信公众号撰写深度健康养生科普推文的**顶尖主编**，参考**《人民日报健康客户端》**或**《生命时报》**的行文风格。
    【你本次使用的特定风格模版与人设】：${styleDesc}
    
    【全局语言风格调优】：
    1. **去术语化**：减少晦涩术语，用生活化类比解释。
    2. **语感分寸**：专业但亲切，介于教科书和市井口语之间。
    3. **对话与引用**：双引号内容（对话/引用）必须使用**正常、朴实、自然的交谈语言**，严禁网络烂梗。

    【核心任务】：针对主题“${topic}”创作一篇深度原创长文。
    
    【行文逻辑与结构 (CRITICAL - 仿人民日报健康客户端风格)】：
    1. **拒绝僵化模版**：严禁使用“第一点、第二点”或“Part 1、Part 2”这种刻板的八股文结构。
    2. **宏观开篇（重中之重）**：
       - **严禁**开篇直接讲“昨天诊室来个病人”这种具体的个案故事。
       - **必须**从宏观视角切入。
       - 语气要大气、有时效性。
    3. **专家视角展开**：
       - 引入话题后，自然过渡到专家视角（“从中医角度来看...”）。
       - 结合《内经》或《伤寒》经典理论（需翻译成人话），深度剖析问题的根源。
       - 给出实实在在的建议（食疗、穴位、起居），强调“治未病”。
    
    【视觉指令 (CRITICAL)】：
    1. **封面图指令 (COVER)**：
       请在文章的最开头（第一行），生成一个**封面图描述**，格式：((COVER_IMG: ...))。
    2. **配图埋点指令 (BODY)**：
       必须在文章正文中自然插入至少 4 个配图埋点，格式为 ((IMG: ...))。
    3. **安全与防风控规则（适用于封面和配图）**：
       - 只描述纯粹的视觉画面（物体、静止场景、自然环境）。
       - 严禁出现敏感词：“汗水/sweat”、“身体特写/body close-up”、“剧烈运动”、“疼痛”、“皮肤/skin”、“肌肉”、“裸露”。
       - 替换为：“客厅”、“瑜伽馆”、“阳光”、“微笑”、“晨练”、“茶室”等安全词汇。

    【内容要素】：
    1. **字数**：${wordCount} 字左右。
    2. **组件使用**：
       - 需要对比时，自然地插入 Markdown 表格。
       - 关键结论处，自然使用【核心提示：...】格式强调。
    
    直接输出正文，不要输出思考过程。
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // 【已修复】确保使用的是真实存在的文本模型
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
      }
    });
    return cleanText(response.text || "");
  } catch (error) {
    console.error("Text generation failed:", error);
    throw new Error("Failed to generate article text.");
  }
};

export const generateImage = async (promptText: string, styleName: StyleKey | string, isCover: boolean = false): Promise<string> => {
  const maxRetries = 2;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const finalPrompt = getEnhancedImagePrompt(promptText, styleName, isCover);
      const aspectRatio = isCover ? "16:9" : "4:3";
      
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001', // 【致命错误已修复】：改成了实际存在的 imagen-3.0 模型
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
          outputMimeType: 'image/jpeg'
        }
      });

      const base64String = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64String) {
        return `data:image/jpeg;base64,${base64String}`;
      }
      
      throw new Error("No image data returned from API (possible safety block)");
    } catch (error: any) {
      attempt++;
      console.warn(`Image gen attempt ${attempt} failed`, error);
      
      const isRateLimit = error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'));
      if (isRateLimit && attempt < maxRetries) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === maxRetries) {
          const encodedText = encodeURIComponent("API 拒绝访问，请检查全局代理");
          return `https://placehold.co/800x600/f3f4f6/9ca3af?text=${encodedText}&font=roboto`;
      }
    }
  }
  return "https://placehold.co/800x600/f3f4f6/9ca3af?text=Image+Unavailable";
};