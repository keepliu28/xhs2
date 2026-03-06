import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const getAI = (customKey?: string) => {
  const key = customKey || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: key || "" });
};

const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota'))) {
      console.warn(`[Gemini] Rate limit hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const getTrendingBooks = async (language: 'zh' | 'en' = 'zh', customKey?: string, excludeTitles: string[] = []) => {
  const ai = getAI(customKey);
  
  const themesZh = [
    "搞钱思维与财富认知", "清醒独立与女性主义", "断舍离与极简生活", 
    "原生家庭与自我疗愈", "高敏感人群的生存指南", "职场向上管理与人性", 
    "亲密关系与依恋类型", "哲学思考与人生虚无", "独处艺术与精神内耗", 
    "冷门神作与文学审美", "社会学视角看世界"
  ];
  const themesEn = [
    "Wealth Mindset & Financial Freedom", "Female Independence & Feminism", "Minimalism & Decluttering",
    "Family Trauma & Self-Healing", "Survival Guide for HSPs", "Workplace Politics & Human Nature",
    "Intimacy & Attachment Styles", "Philosophy & Nihilism", "Solitude & Overthinking",
    "Hidden Literary Gems", "Sociological Perspectives"
  ];
  
  const themes = language === 'zh' ? themesZh : themesEn;
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  
  // Take up to 30 random excluded titles to save tokens but provide context
  const avoidList = excludeTitles.sort(() => 0.5 - Math.random()).slice(0, 30).join(', ');
  const avoidPrompt = avoidList ? (language === 'zh' ? `\n请绝对不要推荐以下书籍（已处理过）：${avoidList}。` : `\nStrictly DO NOT recommend these books (already processed): ${avoidList}.`) : '';

  const prompt = language === 'zh' 
    ? `你是一个深谙小红书爆款逻辑的读书博主。请推荐15本关于【${randomTheme}】主题的书籍。
    要求：
    1. 选书标准：要有“社交货币”属性，要么能提升认知（如《纳瓦尔宝典》），要么能提供极致情绪价值（如《绝叫》），或者格调极高的小众佳作。
    2. 拒绝烂大街：不要推荐《活着》、《百年孤独》、《被讨厌的勇气》等过于大众的书。
    3. 确保真实：书籍必须真实存在。
    4. 多样性：包含不同国家、不同风格的作品。${avoidPrompt}
    随机标识: ${Math.random()}`
    : `You are a BookTok influencer who knows what goes viral. Recommend 15 books on the theme of [${randomTheme}].
    Requirements:
    1. Selection Criteria: Books with "social currency" - either cognitive upgrades (like "The Almanack of Naval Ravikant") or extreme emotional value (like "The Silent Patient"), or high-brow niche gems.
    2. Avoid Clichés: No "Atomic Habits", "The Alchemist", or "1984".
    3. Real Books Only: Strictly NO hallucinations.
    4. Diversity: Mix of international authors and styles.${avoidPrompt}
    Random ID: ${Math.random()}`;

  return retryWithBackoff(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.95, // Higher temperature for more creativity and variety
          topP: 0.95,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The title of the book" },
                author: { type: Type.STRING, description: "The author of the book" }
              },
              required: ["title"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("[Gemini] getTrendingBooks JSON Parse Error:", e, "Raw Text:", text);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanText);
      }
    } catch (error) {
      console.error("[Gemini] getTrendingBooks Error:", error);
      throw error;
    }
  });
};

export const generateBookList = async (topic: string, language: 'zh' | 'en' = 'zh', customKey?: string) => {
  const ai = getAI(customKey);
  const systemPrompt = language === 'zh'
    ? `你是一个深谙小红书爆款逻辑的读书博主。
    根据用户提供的话题“${topic}”，推荐2-4本相关的书籍。
    要求：
    1. 选书标准：要有“社交货币”属性，能提升认知或提供极高情绪价值。拒绝平庸。
    2. 格式要求：
       - coverTitle: 针对整个书单的爆款封面标题。必须使用“数字+人群+结果”的爆款公式。例如：“读完这4本书，我戒掉了穷人思维”、“月薪5k到5w，我只做了这一件事（附书单）”。要极具冲击力，让人一眼产生“获得感”。
       - books: 书籍列表，每本书包含：
         - title: 书名。
         - author: 作者。
         - description: 一句话简介，要扎心、有共鸣（如：教你如何不靠运气致富，看透商业本质）。
         - color: 符合书籍氛围的高级色（Hex格式）。
       - tags: 必须包含 #女性成长 #搞钱 #认知觉醒 #书单 #成长笔记 等高流量池标签。
    3. 必须真实：书籍必须真实存在。`
    : `You are a viral BookTok influencer.
    Recommend 2-4 books related to the topic "${topic}".
    Requirements:
    1. Selection Criteria: Books with "social currency" - cognitive upgrades or high emotional value.
    2. Format Requirements:
       - coverTitle: A viral title for the entire book list. Use the "Number + Audience + Result" viral formula. e.g., "4 Books that cured my broke mindset", "From $5k to $50k, I only did this one thing (Book List included)". High impact, providing a "sense of gain".
       - books: List of books, each including:
         - title: Book title.
         - author: Author.
         - description: A one-sentence summary that resonates (e.g., How to get rich without being lucky, seeing through the essence of business).
         - color: A sophisticated hex code matching the book's vibe.
       - tags: Must include #PersonalGrowth #Mindset #BookList #SelfImprovement #Viral.
    3. Real Books Only: Strictly NO hallucinations.`;

  return retryWithBackoff(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Topic: ${topic}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coverTitle: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              books: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    description: { type: Type.STRING },
                    color: { type: Type.STRING }
                  },
                  required: ["title", "author", "description", "color"]
                }
              }
            },
            required: ["coverTitle", "books", "tags"]
          }
        }
      });
      
      const text = response.text || "{}";
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("[Gemini] JSON Parse Error:", e, "Raw Text:", text);
        // Attempt to clean markdown code blocks if present
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanText);
      }
    } catch (error) {
      console.error("[Gemini] generateBookList Error:", error);
      throw error;
    }
  });
};

export const generateBookContent = async (bookTitle: string, language: 'zh' | 'en' = 'zh', customKey?: string) => {
  const ai = getAI(customKey);
  const systemPrompt = language === 'zh'
    ? `你是一位拥有百万粉丝的小红书读书博主，擅长写出“点赞收藏过万”的爆款笔记。
    针对《${bookTitle}》撰写一篇笔记。
    
    核心逻辑：
    1. **痛点引入**：用一个扎心的问题或场景开篇，直击读者焦虑（如迷茫、内耗、缺钱、缺爱）。
    2. **情绪翻转**：讲述这本书如何改变了你的认知，提供“醍醐灌顶”的爽感。
    3. **干货输出**：提炼3个核心观点，用emoji列表展示，通俗易懂。
    4. **金句结尾**：用一句最有力量的话升华主题，引发转发欲望。
    
    格式要求：
    - 封面标题 (coverTitle)：必须使用“数字+人群+结果”的爆款公式。例如：“读完这4本书，我戒掉了穷人思维”、“月薪5k到5w，我只做了这一件事”。要极具冲击力。
    - 笔记标题 (title)：必须是“主标题 | 副标题”格式，包含数字或强烈情绪词。
    - 内容：口语化，像闺蜜聊天，多用emoji，排版舒适。不要像写论文！
    - 摘录：3条金句，每条50-100字。
    - 标签：必须包含 #女性成长 #搞钱 #认知觉醒 #书单 #成长笔记 等高流量池标签。
    - 颜色：提取书封面的主色调或符合书籍氛围的高级色（Hex格式）。`
    : `You are a viral BookTok/Instagram creator known for posts that get thousands of saves.
    Create a post for "${bookTitle}".
    
    Core Logic:
    1. **The Hook**: Start with a painful question or relatable scenario (anxiety, confusion, burnout).
    2. **The Shift**: Explain how this book changed your perspective (the "Aha!" moment).
    3. **Key Takeaways**: 3 bullet points with emojis, easy to digest.
    4. **The Mic Drop**: End with a powerful statement that makes people want to share.
    
    Format Requirements:
    - Cover Title (coverTitle): Use the "Number + Audience + Result" viral formula. e.g., "4 Books that cured my broke mindset", "From $5k to $50k, I only did this one thing". High impact.
    - Post Title (title): Must be "Keyword | Statement" format (e.g., "Awakening | This book saved my 20s").
    - Content: Conversational, like talking to a best friend. Use emojis. No academic tone!
    - Quotes: 3 powerful excerpts (50-100 words).
    - Tags: Must include #PersonalGrowth #Mindset #BookList #SelfImprovement #Viral.
    - Color: A sophisticated hex code matching the book's vibe.`;

  return retryWithBackoff(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Book: ${bookTitle}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coverTitle: { type: Type.STRING, description: "The viral title for the cover image" },
              title: { type: Type.STRING, description: "The title for the post content" },
              author: { type: Type.STRING },
              fullContent: { type: Type.STRING },
              quotes: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              color: { type: Type.STRING }
            },
            required: ["coverTitle", "title", "author", "fullContent", "quotes", "tags", "color"]
          }
        }
      });
      
      const text = response.text || "{}";
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("[Gemini] generateBookContent JSON Parse Error:", e, "Raw Text:", text);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanText);
      }
    } catch (error) {
      console.error("[Gemini] generateBookContent Error:", error);
      throw error;
    }
  });
};
