import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, MathProblem, Topic, UserStats, MemoryCard } from "../types";

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

// Helper: Validate Key with a standard model
export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const tempAi = new GoogleGenAI({ apiKey: key });
    // Use gemini-1.5-flash as it is the most standard/stable model for validation
    await tempAi.models.generateContent({
      model: "gemini-1.5-flash",
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
             // Simple fraction comparison or addition
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
    // Pick specific topic from the allowed list
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    const { question, ans, explanation } = generateLocalProblemData(topic);

    const correct = isNaN(parseInt(ans)) ? 1 : parseInt(ans); // Handle fraction edge case poorly but safely
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
    await new Promise(r => setTimeout(r, 400)); // Faster fake loading
    return getFallbackProblem(topics);
  }

  // Comma separated topics for prompt
  const topicStr = topics.join(", ");

  const prompt = `Create a fun math problem for a game. 
  ALLOWED TOPICS: ${topicStr} (You MUST pick one of these).
  Difficulty: ${difficulty}. 
  Language: Hebrew.
  Return a JSON object with:
  - question (The math expression)
  - options (Array of 4 possible answers)
  - correctAnswer (The correct answer)
  - explanation (Short Hebrew explanation)
  - topic (Which topic you picked from the allowed list)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Use flash for speed
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
    
    // Ensure the returned topic is valid, otherwise default to first selected
    let finalTopic = topics[0];
    const normalizedReturnedTopic = data.topic ? data.topic.toUpperCase() : '';
    // Check if returned topic matches any of our enum values (roughly)
    if (Object.values(Topic).includes(data.topic as Topic)) {
        finalTopic = data.topic as Topic;
    }

    return {
      ...data,
      topic: finalTopic, 
      difficulty
    };
  } catch (error) {
    console.error("AI Error:", error);
    return getFallbackProblem(topics);
  }
};

// --- MEMORY GAME GENERATOR (LOCAL ONLY FOR SPEED) ---
export const generateMemoryGameSet = (topics: Topic[], pairCount: number = 6): MemoryCard[] => {
    const cards: MemoryCard[] = [];
    
    for (let i = 0; i < pairCount; i++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const { question, ans } = generateLocalProblemData(topic);
        
        const pairId = `pair-${i}`;
        
        // Problem Card
        cards.push({
            id: `card-${i}-prob`,
            content: question,
            type: 'problem',
            pairId,
            isFlipped: false,
            isMatched: false
        });

        // Answer Card
        cards.push({
            id: `card-${i}-ans`,
            content: ans,
            type: 'answer',
            pairId,
            isFlipped: false,
            isMatched: false
        });
    }

    // Shuffle
    return cards.sort(() => Math.random() - 0.5);
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
