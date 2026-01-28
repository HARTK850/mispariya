import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, MathProblem, Topic, UserStats } from "../types";

const LOCAL_STORAGE_KEY_NAME = 'misparia_api_key';

// Helper: Get key from storage or env
export const getStoredApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_NAME);
    if (stored) return stored;
  }
  // Fallback to env if available (dev mode)
  try {
     if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
       return process.env.API_KEY;
     }
  } catch(e) {}
  return null;
};

// Helper: Validate Key by making a small request
export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const tempAi = new GoogleGenAI({ apiKey: key });
    // Minimal request to check validity
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


// Lazy initialization of AI client
let aiClient: GoogleGenAI | null = null;
let currentKey: string | null = null;

const getAiClient = () => {
  const key = getStoredApiKey();
  if (!key) {
    console.warn("No API key found.");
    return null;
  }
  
  // Re-init if key changed or first time
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

// Fallback logic remains similar but adjusted for multi-topics if needed (simplified here)
const getFallbackProblem = (topics: Topic[]): MathProblem => {
    // Pick random topic from selected
    const topic = topics[Math.floor(Math.random() * topics.length)] || Topic.ADDITION;
    
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    let question = "", ans = "", explanation = "";
    
    switch (topic) {
        case Topic.MULTIPLICATION:
            question = `${num1} × ${num2}`;
            ans = (num1 * num2).toString();
            explanation = `כפל הוא חיבור חוזר. ${num1} פעמים ${num2} זה ${ans}.`;
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
             explanation = `אם יש לך ${sum} ומורידים ${num1}, נשארים עם ${num2}.`;
             break;
        default: // ADDITION
            question = `${num1} + ${num2}`;
            ans = (num1 + num2).toString();
            explanation = `אם מחברים ${num1} ועוד ${num2}, מקבלים ${ans}.`;
    }

    const correct = parseInt(ans);
    const optionsSet = new Set<string>();
    optionsSet.add(ans);
    while(optionsSet.size < 4) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const wrong = correct + (offset === 0 ? 1 : offset);
        optionsSet.add(wrong.toString());
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
    await new Promise(r => setTimeout(r, 600)); // Fake loading
    return getFallbackProblem(topics);
  }

  // Comma separated topics for prompt
  const topicStr = topics.join(", ");

  const prompt = `Create a fun math problem for a game. 
  Topics allowed: ${topicStr}. Pick one. 
  Difficulty: ${difficulty}. 
  Language: Hebrew.
  Return a JSON object with:
  - question (The math expression, e.g., "5 + 3" or "What is half of 10?")
  - options (Array of 4 possible answers as strings)
  - correctAnswer (The correct answer string, must match one option)
  - explanation (A super short, fun explanation in Hebrew)
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
          },
          required: ["question", "options", "correctAnswer", "explanation"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    const data = JSON.parse(text);
    
    // Attempt to deduce topic if generic
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    return {
      ...data,
      topic: randomTopic, 
      difficulty
    };
  } catch (error) {
    console.error("AI Error:", error);
    return getFallbackProblem(topics);
  }
};

export const getTutorResponse = async (message: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "היי! כדי שאוכל לענות, צריך להגדיר מפתח API בהגדרות (סמל המפתח למעלה).";

    try {
        const chat = ai.chats.create({
            model: "gemini-3-flash-preview",
            history: history,
            config: {
                systemInstruction: `You are 'Numbery', a gamer robot math tutor. 
                Speak Hebrew. Use gamer slang (XP, Level Up, Quest). 
                Keep it short and exciting.`,
            }
        });

        const result = await chat.sendMessage({ message });
        return result.text || "Glitch in the matrix... נסה שוב?";
    } catch (e) {
        console.error(e);
        return "Connection Error... נסה שוב.";
    }
}

export const generatePersonalizedAnalysis = async (stats: UserStats): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "חסר מפתח API. הגדר אותו כדי לקבל ניתוח חכם.";

    const summary = Object.entries(stats.topicPerformance).map(([topic, data]) => {
        const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        return `${topic}: ${percent}%`;
    }).join('\n');

    const prompt = `You are a Game Master analyzing player stats.
    Write a short, hype-filled report in Hebrew.
    Identify strongest/weakest skills.
    Use terms like "Power Level", "Buff needed", "Critical Hit".
    
    Stats: ${summary}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        return response.text || "Error generating report.";
    } catch (e) {
        return "Error analyzing stats.";
    }
};