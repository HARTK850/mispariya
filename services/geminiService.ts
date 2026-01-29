import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, MathProblem, Topic, UserStats, MemoryCard } from "../types";

const LOCAL_STORAGE_KEY_NAME = 'misparia_api_key';

export const getStoredApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_NAME);
    if (stored) return stored;
  }
  try {
     if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
       return process.env.API_KEY;
     }
  } catch(e) {}
  return null;
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const tempAi = new GoogleGenAI({ apiKey: key });
    // Use gemini-3-flash-preview as it is the model used in the app. 
    // Older models might be 404 in certain regions or beta endpoints.
    await tempAi.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Test",
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Failed:", error);
    return false;
  }
};

export const saveApiKey = (key: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_NAME, key);
};

export const clearApiKey = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY_NAME);
};

let aiClient: GoogleGenAI | null = null;
let currentKey: string | null = null;

const getAiClient = () => {
  const key = getStoredApiKey();
  if (!key) {
    return null;
  }
  
  if (!aiClient || currentKey !== key) {
    try {
      aiClient = new GoogleGenAI({ apiKey: key });
      currentKey = key;
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
      return null;
    }
  }
  return aiClient;
};

// --- LOGIC FOR GENERATING MATH PROBLEMS (LOCAL & AI) ---

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateLocalProblemData = (topic: Topic) => {
    const num1 = getRandomInt(2, 10);
    const num2 = getRandomInt(2, 10);
    let question = "", ans = "", explanation = "";

    switch (topic) {
        case Topic.MULTIPLICATION:
            question = `${num1} × ${num2}`;
            ans = (num1 * num2).toString();
            explanation = `${num1} פעמים ${num2} זה ${ans}.`;
            break;
        case Topic.DIVISION:
            const product = num1 * num2;
            question = `${product} ÷ ${num1}`;
            ans = num2.toString();
            explanation = `${num1} נכנס ב-${product} בדיוק ${num2} פעמים.`;
            break;
        case Topic.SUBTRACTION:
             const sum = num1 + num2;
             question = `${sum} - ${num1}`;
             ans = num2.toString();
             explanation = `${sum} פחות ${num1} משאיר ${num2}.`;
             break;
        case Topic.FRACTIONS:
             question = `½ + ½`;
             ans = "1";
             explanation = "חצי ועוד חצי זה שלם אחד.";
             break;
        default: // ADDITION
            question = `${num1} + ${num2}`;
            ans = (num1 + num2).toString();
            explanation = `${num1} ועוד ${num2} שווה ${ans}.`;
    }
    return { question, ans, explanation };
};

const getFallbackProblem = (topics: Topic[]): MathProblem => {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const { question, ans, explanation } = generateLocalProblemData(topic);

    const correct = isNaN(parseInt(ans)) ? 1 : parseInt(ans); 
    const optionsSet = new Set<string>();
    optionsSet.add(ans);
    while(optionsSet.size < 4) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const val = correct + (offset === 0 ? 1 : offset);
        optionsSet.add(val.toString());
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return {
        question,
        options,
        correctAnswer: ans,
        explanation,
        topic: topic,
        difficulty: Difficulty.BEGINNER,
        isChallenge: false
    };
};

export const generateMathProblem = async (topics: Topic[], difficulty: Difficulty): Promise<MathProblem | null> => {
  const ai = getAiClient();
  
  if (!ai) {
    await new Promise(r => setTimeout(r, 300));
    return getFallbackProblem(topics);
  }

  const topicStr = topics.join(", ");
  const prompt = `Generate 1 math problem.
  ALLOWED TOPICS: ${topicStr}.
  Difficulty: ${difficulty}.
  Language: Hebrew.
  JSON response:
  - question (string)
  - options (string array length 4)
  - correctAnswer (string)
  - explanation (string)
  - topic (string from allowed list)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            topic: { type: Type.STRING } 
          },
          required: ["question", "options", "correctAnswer", "explanation"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    const data = JSON.parse(text);
    
    let finalTopic = topics[0];
    if (Object.values(Topic).includes(data.topic as Topic)) {
        finalTopic = data.topic as Topic;
    }

    return { ...data, topic: finalTopic, difficulty };
  } catch (error) {
    console.error("AI Error:", error);
    return getFallbackProblem(topics);
  }
};

export const generateMemoryGameSet = (topics: Topic[], pairCount: number = 6): MemoryCard[] => {
    const cards: MemoryCard[] = [];
    for (let i = 0; i < pairCount; i++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const { question, ans } = generateLocalProblemData(topic);
        const pairId = `pair-${i}`;
        
        cards.push({ id: `card-${i}-prob`, content: question, type: 'problem', pairId, isFlipped: false, isMatched: false });
        cards.push({ id: `card-${i}-ans`, content: ans, type: 'answer', pairId, isFlipped: false, isMatched: false });
    }
    return cards.sort(() => Math.random() - 0.5);
};

export const getTutorResponse = async (message: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "כדי שאוכל לדבר איתך, צריך לחבר אותי למנוע ה-AI בהגדרות (מפתח API).";

    try {
        const chat = ai.chats.create({
            model: "gemini-3-flash-preview",
            history: history,
            config: {
                systemInstruction: `You are 'Numbery', a friendly math tutor robot. Speak Hebrew. Be encouraging and helpful.`,
            }
        });
        const result = await chat.sendMessage({ message });
        return result.text || "לא הבנתי, אפשר שוב?";
    } catch (e) {
        return "יש לי בעיה בתקשורת כרגע.";
    }
}

export const generatePersonalizedAnalysis = async (stats: UserStats): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "נא להגדיר מפתח API כדי לקבל ניתוח.";

    const summary = Object.entries(stats.topicPerformance).map(([topic, data]) => {
        const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        return `${topic}: ${percent}%`;
    }).join('\n');

    const prompt = `Analyze student stats. Write a short, encouraging report in Hebrew.
    Stats: ${summary}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        return response.text || "שגיאה בניתוח.";
    } catch (e) {
        return "לא הצלחתי לנתח את הנתונים.";
    }
};
