import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { QuizQuestion, ShortAnswerQuestion, QuizDifficulty } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Start of Retry Logic ---
const isRetriableError = (error: any): boolean => {
  if (error && error.message) {
    // Check for common transient error messages from the Gemini API
    return /500|503|xhr error|network/i.test(error.message);
  }
  return false;
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isRetriableError(error)) {
      console.warn(`Retrying due to error: ${error}. Retries left: ${retries - 1}`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};
// --- End of Retry Logic ---


const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "The multiple-choice question."
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 4 possible answers."
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "The 0-based index of the correct answer in the 'options' array."
      },
      topic: {
        type: Type.STRING,
        description: "A brief topic for this question, extracted from the source text."
      }
    },
    required: ["question", "options", "correctAnswerIndex", "topic"]
  }
};

const shortAnswerQuizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "The short-answer question."
      },
      correctAnswer: {
        type: Type.STRING,
        description: "A concise, correct answer to the question."
      },
      topic: {
        type: Type.STRING,
        description: "A brief topic for this question, extracted from the source text."
      }
    },
    required: ["question", "correctAnswer", "topic"]
  }
};

const verificationSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: {
            type: Type.BOOLEAN,
            description: "Whether the user's answer is semantically correct."
        },
        feedback: {
            type: Type.STRING,
            description: "A very brief, one-sentence explanation for why the answer is correct or incorrect."
        }
    },
    required: ["isCorrect", "feedback"]
};


export const generateSummary = (text: string): Promise<string> => withRetry(async () => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Summarize the following text for a student preparing for an exam. Focus on the key concepts, definitions, and main points. The summary should be well-structured and easy to digest:\n\n---\n${text}\n---`,
  });
  return response.text;
});

export const generateQuiz = (text: string, difficulty: QuizDifficulty, weakTopics: string[]): Promise<QuizQuestion[]> => withRetry(async () => {
  let prompt = `Based on the following text, generate a 10-question multiple-choice quiz of ${difficulty} difficulty. Each question should have 4 options.`;
  if (weakTopics.length > 0) {
    prompt += ` Pay special attention to the following topics the user has struggled with: ${weakTopics.join(', ')}.`;
  }
  prompt += `\n\n---\n${text}\n---`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema,
    },
  });
  
  try {
    const jsonText = response.text.trim();
    const sanitizedJsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
    const parsed = JSON.parse(sanitizedJsonText);
    return parsed as QuizQuestion[];
  } catch(e) {
    console.error("Failed to parse quiz JSON:", e);
    console.error("Received text:", response.text);
    return [];
  }
});

export const generateShortAnswerQuiz = (text: string): Promise<ShortAnswerQuestion[]> => withRetry(async () => {
  const prompt = `Based on the following text, generate a 5-question short-answer quiz. The questions should be answerable with a single line of text or a few key words. Focus on definitions, key concepts, and factual recall.\n\n---\n${text}\n---`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: shortAnswerQuizSchema,
    },
  });

  try {
    const jsonText = response.text.trim();
    const sanitizedJsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
    const parsed = JSON.parse(sanitizedJsonText);
    return parsed as ShortAnswerQuestion[];
  } catch(e) {
    console.error("Failed to parse short answer quiz JSON:", e);
    console.error("Received text:", response.text);
    return [];
  }
});

export const generateDiagram = (text: string): Promise<string> => withRetry(async () => {
  const prompt = `Analyze the following text and generate a Mermaid.js graph visualization script (e.g., flowchart, mindmap, sequence diagram) that represents the key concepts and their relationships. Only output the Mermaid script inside a single \`\`\`mermaid code block. Do not add any other explanatory text.

IMPORTANT RULE: To avoid syntax errors, all text within nodes must be enclosed in double quotes. For example, use A["Node text with (parentheses)"] instead of A[Node text with (parentheses)].

Text to analyze:
---
${text}
---
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const diagramText = response.text;
  const match = diagramText.match(/```mermaid([\s\S]*?)```/);
  return match ? match[1].trim() : "graph TD;\nA[Could not generate diagram];";
});

export const verifyShortAnswer = (question: string, correctAnswer: string, userAnswer: string): Promise<{ isCorrect: boolean; feedback: string; }> => withRetry(async () => {
    const prompt = `A user is answering a short-answer question. Please evaluate if their answer is correct.
    
    Context:
    - Question: "${question}"
    - The expected correct answer is: "${correctAnswer}"
    - The user's submitted answer is: "${userAnswer}"
    
    Evaluation criteria:
    - The user's answer does not have to be an exact match.
    - Judge based on semantic meaning. Is the user's answer conveying the same information as the correct answer?
    - Be lenient with minor typos or grammatical errors.
    
    Respond with a JSON object indicating if the answer is correct and provide brief feedback.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: verificationSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const sanitizedJsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
        return JSON.parse(sanitizedJsonText) as { isCorrect: boolean, feedback: string };
    } catch(e) {
        console.error("Failed to parse verification JSON:", e, response.text);
        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        return { isCorrect, feedback: isCorrect ? "Correct." : "Incorrect." };
    }
});


export const startTutorChat = (context: string): Chat => {
  const systemInstruction = `You are an expert AI tutor. Your knowledge is strictly limited to the following text provided by the user. Do not answer any questions outside of this context. Be helpful, encouraging, and break down complex topics into simple explanations. When asked a question, find the relevant information from the text and explain it clearly. Do not make up information or answer questions on other subjects. If you cannot find an answer in the text, say "I can't find information about that in your study material." Here is the study material:\n\n---\n${context}\n---`;
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
  return chat;
};