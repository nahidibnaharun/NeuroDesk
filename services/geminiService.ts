import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Question, QuestionType, OpenEnded, AnswerFeedback, QuizHistoryItem, HistoryItem, ChatMessage, WeakAreaAnalysis, AIGeneratedRoadmapNode, FlowchartNode } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MCQ_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "The multiple-choice question." },
    options: {
      type: Type.ARRAY,
      description: "An array of 4-5 potential answers.",
      items: { type: Type.STRING },
    },
    answer: { type: Type.STRING, description: "The correct answer from the options list." },
    explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct." },
    hint: { type: Type.STRING, description: "A short, one-sentence hint that helps the user but does not give away the answer."}
  },
  required: ["question", "options", "answer", "explanation", "hint"],
};

const TF_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "The true or false statement." },
    answer: { type: Type.BOOLEAN, description: "The correct answer, either true or false." },
    explanation: { type: Type.STRING, description: "A brief explanation of why the statement is true or false." },
    hint: { type: Type.STRING, description: "A short, one-sentence hint that helps the user but does not give away the answer."}
  },
  required: ["question", "answer", "explanation", "hint"],
};

const FITB_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "A sentence with a blank, represented by '_____." },
    answer: { type: Type.STRING, description: "The word or short phrase that correctly fills the blank." },
    explanation: { type: Type.STRING, description: "A brief explanation of the context or definition of the answer." },
    hint: { type: Type.STRING, description: "A short, one-sentence hint that describes the context of the missing word but does not give away the answer."}
  },
  required: ["question", "answer", "explanation", "hint"],
};

const OE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "An open-ended question that requires a written response." },
    idealAnswer: { type: Type.STRING, description: "A detailed, ideal answer that can be used as a rubric for grading." },
    explanation: { type: Type.STRING, description: "Context or key points related to the question." },
    hint: { type: Type.STRING, description: "A short, one-sentence hint that points towards the relevant concept but does not give away the answer."}
  },
  required: ["question", "idealAnswer", "explanation", "hint"],
}

const getQuestionSchema = (type: QuestionType) => {
    switch(type) {
        case QuestionType.MultipleChoice: return MCQ_SCHEMA;
        case QuestionType.TrueFalse: return TF_SCHEMA;
        case QuestionType.FillInTheBlank: return FITB_SCHEMA;
        case QuestionType.OpenEnded: return OE_SCHEMA;
    }
}

export const generateQuestions = async (
  studyContent: string,
  questionType: QuestionType,
  difficulty: string,
  count: number = 5,
  topic?: string,
): Promise<Question[]> => {
  const schema = getQuestionSchema(questionType);
  
  let topicInstruction = '';
  if (topic && topic.trim()) {
    topicInstruction = `Focus specifically on the topic of "${topic}" within the material.`
  }

  const prompt = `Based on the following study material, generate ${count} ${difficulty}-level questions of type "${questionType}". For each question, also provide a helpful hint that guides the student without revealing the answer. ${topicInstruction}

  Material:
  ---
  ${studyContent}
  ---`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: schema,
        },
        temperature: 0.8,
      },
    });

    const jsonText = response.text.trim();
    const questionsData = JSON.parse(jsonText);
    return questionsData.map((q: any) => ({ ...q, type: questionType }));
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions. The AI might be busy or the content is too complex. Please try again.");
  }
};

export const generateSummary = async (studyContent: string): Promise<string> => {
    const prompt = `Summarize the following text into clear, structured notes with bullet points. Focus on the key concepts, definitions, and important facts. The summary should be easy for a student to review.

    Text:
    ---
    ${studyContent}
    ---`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary. Please try again.");
    }
};

export const generateSpokenSummary = async (studyContent: string): Promise<string> => {
    const prompt = `Create a concise, conversational summary of the following text. The summary should be easy to understand when read aloud, like a short podcast segment. Focus on the main ideas and present them in a clear, narrative style. Avoid complex lists or jargon. The summary should be between 150 and 250 words.

    Text:
    ---
    ${studyContent}
    ---`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.6
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating spoken summary:", error);
        throw new Error("Failed to generate spoken summary. Please try again.");
    }
};

export const generateDiagram = async (prompt: string): Promise<string> => {
    const fullPrompt = `Generate a safe-for-work, educational diagram for a student. The diagram must be simple, clear, and suitable for a learning context. Visually represent the following concept: "${prompt}". The output should be a clean diagram like a flowchart, mind map, or concept map on a white background. Absolutely no harmful, explicit, or otherwise inappropriate content.`;
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Image generation returned no images, which is often due to safety filters. Please try rephrasing your prompt to be more specific and educational.");
        }

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Full error during diagram generation:", error);
        
        let detailedMessage = "The AI might be having trouble visualizing the concept. Try a different prompt.";
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('api key not valid')) {
                detailedMessage = "Your API key is not valid. Please check your .env file.";
            } else if (msg.includes('permission denied') || msg.includes('forbidden')) {
                detailedMessage = "Your API key lacks permission for the Imagen model. Please enable the 'Generative Language API' (or 'AI Platform') in your Google Cloud project.";
            } else if (msg.includes('billing')) {
                detailedMessage = "This feature likely requires a billing account to be linked to your Google Cloud project. Please check your project's billing status.";
            } else if (msg.includes('location')) {
                 detailedMessage = "Your user location is not supported for this API. Please check Google's supported regions.";
            } else if (msg.includes('filtered') || msg.includes('violated') || msg.includes('returned no images')) {
                detailedMessage = "The request was blocked by safety filters. Please rephrase your prompt to be more educational and specific.";
            } else {
                detailedMessage = "The request failed. This is often due to an invalid API key, lack of permissions for the Imagen model, or a disabled billing account on your project. Please verify these settings in your Google Cloud Console.";
            }
        }
        
        throw new Error(`Failed to generate diagram. ${detailedMessage}`);
    }
};

export const gradeOpenEndedAnswer = async (question: OpenEnded, userAnswer: string): Promise<AnswerFeedback> => {
    const prompt = `As a teacher, evaluate the student's answer. 
    Question: "${question.question}"
    Ideal Answer for reference: "${question.idealAnswer}"
    Student's Answer: "${userAnswer}"
    
    Is the student's answer substantially correct? Provide brief, constructive feedback.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCorrect: { 
                            type: Type.BOOLEAN, 
                            description: "Whether the student's answer is considered correct." 
                        },
                        feedbackText: { 
                            type: Type.STRING, 
                            description: "Constructive feedback for the student."
                        }
                    },
                    required: ["isCorrect", "feedbackText"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error grading answer:", error);
        return {
            isCorrect: false,
            feedbackText: "Sorry, I couldn't grade this answer automatically. Please review it manually against the ideal answer."
        };
    }
}

const WEAK_AREA_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        weakAreas: {
            type: Type.ARRAY,
            description: "An array of 2-3 specific topics or concepts the user struggled with. Should be concise.",
            items: { type: Type.STRING },
        },
        message: {
            type: Type.STRING,
            description: "A friendly message to the user, either encouraging them or explaining there isn't enough data."
        }
    },
    required: ["weakAreas", "message"],
};


export const analyzeWeakAreas = async (history: QuizHistoryItem[]): Promise<WeakAreaAnalysis> => {
    if(history.length < 1) { // Require at least one quiz
        return { weakAreas: [], message: "Complete a few more quizzes to unlock your personalized focus plan." };
    }

    const relevantHistory = history.map(item => ({
        mode: item.result.mode,
        score: item.result.score,
        total: item.result.total,
        questions: item.result.questions.map((q, i) => ({
            question: q.question,
            type: q.type,
            userAnswer: item.result.userAnswers[i],
            isCorrect: item.result.feedback?.[i]?.isCorrect,
            confidence: item.result.confidenceLevels?.[i]
        })),
    }));

    const prompt = `As an expert learning coach, analyze the following quiz history for a student. Identify up to 3 specific topics or concepts where the student is weakest based on their incorrect answers, especially on questions where their confidence was high. Keep the topic names very short and actionable (e.g., "Cellular Respiration", "Newton's Laws", "JavaScript Promises").

    If the user is doing well or there's not enough data to form a conclusion, provide an encouraging message.

    Student's Quiz History:
    ---
    ${JSON.stringify(relevantHistory)}
    ---

    Respond with a JSON object that strictly follows the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: WEAK_AREA_SCHEMA,
                temperature: 0.3
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch(error) {
        console.error("Error analyzing weak areas:", error);
        return { weakAreas: [], message: "Could not analyze your history at the moment. Please try again later."};
    }
}

export const explainCode = async (code: string): Promise<string> => {
    const prompt = `As an expert programmer and teacher, provide a clear, step-by-step explanation for the following code. Break down complex parts, explain the purpose of functions/classes, and the overall logic. Format the output with markdown for clarity (use lists and bold text).

    Code:
    ---
    ${code}
    ---`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error explaining code:", error);
        throw new Error("Failed to explain code. The AI might be busy or the code is too complex.");
    }
};

const ROADMAP_SUBNODE_L2_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    resources: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["title", "description"],
}

const ROADMAP_SUBNODE_L1_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    resources: { type: Type.ARRAY, items: { type: Type.STRING } },
    subNodes: {
      type: Type.ARRAY,
      items: ROADMAP_SUBNODE_L2_SCHEMA,
    }
  },
  required: ["title", "description"],
}

const ROADMAP_NODE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the high-level learning topic or skill." },
    description: { type: Type.STRING, description: "A brief, one or two-sentence description of the topic." },
    resources: {
      type: Type.ARRAY,
      description: "An array of 2-3 suggested learning resources (e.g., 'Read about X', 'Watch a video on Y').",
      items: { type: Type.STRING },
    },
    subNodes: {
      type: Type.ARRAY,
      description: "An array of sub-topics or skills required for this node. Can be empty.",
      items: ROADMAP_SUBNODE_L1_SCHEMA,
    },
  },
  required: ["title", "description", "subNodes"],
};


export const generateRoadmap = async (studyContent?: string, topic?: string): Promise<AIGeneratedRoadmapNode[]> => {
    if (!studyContent && !topic) {
        throw new Error("Either study content or a topic must be provided to generate a roadmap.");
    }

    let prompt = `Based on the provided information, act as an expert teacher and create a structured, node-based learning roadmap. The roadmap should consist of a few high-level modules. Each module should have a title, a short description, and a list of sub-nodes representing smaller, ordered learning steps. Each step should also have a title, description, and a few suggested learning resources (like "Read about X" or "Practice Y"). Organize the sub-nodes logically. Generate up to 3 levels of nesting (module -> sub-topic -> specific task).`;

    if (topic) {
        prompt += `\n\nThe main topic for this roadmap is: "${topic}".`;
    }

    if (studyContent) {
        prompt += `\n\nUse the following material as context:\n---\n${studyContent}\n---`;
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: ROADMAP_NODE_SCHEMA,
                },
                temperature: 0.6,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating roadmap:", error);
        
        let detailedMessage = "The AI might be busy, or the topic is too complex. Try simplifying your input.";
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('api key not valid')) {
                detailedMessage = "Your API key is not valid. Please check your local environment configuration (e.g., .env file).";
            } else if (msg.includes('permission denied') || msg.includes('forbidden')) {
                detailedMessage = "Your API key lacks the necessary permissions. Please enable the 'Generative Language API' (or 'AI Platform') in your Google Cloud project.";
            } else if (msg.includes('billing')) {
                detailedMessage = "This feature likely requires a billing account to be linked to your Google Cloud project. Please check your project's billing status.";
            } else if (msg.includes('location')) {
                 detailedMessage = "Your user location is not supported for this API. Please check Google's supported regions.";
            } else if (msg.includes('json') || msg.includes('schema')) {
                detailedMessage = "The AI's response was not in the expected format. This can happen with very complex topics. Please try simplifying your request.";
            }
        }
        
        throw new Error(`Failed to generate a roadmap. ${detailedMessage}`);
    }
};

const FLOWCHART_NODE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier for this node (e.g., 'node-1')." },
        type: {
            type: Type.STRING,
            description: "The type of flowchart node.",
            enum: ['start', 'end', 'process', 'decision', 'io']
        },
        content: { type: Type.STRING, description: "The text content to display inside the node." },
        connections: {
            type: Type.ARRAY,
            description: "Connections to subsequent nodes. A 'decision' node must have two connections with 'Yes' and 'No' labels. Other nodes (except 'end') should have one connection without a label. 'end' nodes have an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    targetId: { type: Type.STRING, description: "The 'id' of the node this connection points to." },
                    label: { type: Type.STRING, description: "The label for this connection path (e.g., 'Yes', 'No'). Only for 'decision' nodes." }
                },
                required: ['targetId']
            }
        }
    },
    required: ["id", "type", "content", "connections"],
};

export const generateFlowchartData = async (code: string): Promise<FlowchartNode[]> => {
    const prompt = `Analyze the following source code and convert its logic into a structured flowchart format. Create a series of connected nodes representing the code's execution path. Each node must have a unique ID, a type, content, and connections to the next node(s).

    Node Types:
    - 'start': The entry point of the code. There should be exactly one.
    - 'end': The exit point. There can be multiple.
    - 'process': A standard operation or calculation.
    - 'decision': A conditional branch (if/else, switch, while). Must have exactly two connections labeled "Yes" and "No".
    - 'io': Input or output operations (e.g., reading a file, printing to console).

    Ensure all logical paths are covered and that all nodes (except 'end' nodes) connect to another node. The 'start' node should be the first item in the array.

    Source Code:
    ---
    ${code}
    ---
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: FLOWCHART_NODE_SCHEMA,
                },
                temperature: 0.3
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as FlowchartNode[];
    } catch (error) {
        console.error("Error generating flowchart data:", error);
        throw new Error("Failed to generate flowchart data. The AI might be busy or the code is too complex to analyze.");
    }
};

export const generateLabReport = async (code: string, results: string): Promise<string> => {
    const prompt = `As an expert scientific researcher, write a formal lab report based on the provided source code and its results. Structure the report with standard sections: Introduction/Objective, Methods, Results, and Discussion/Conclusion. Explain the purpose of the code in the Methods section, present the results clearly, and interpret their significance in the Discussion.

    Source Code:
    ---
    ${code}
    ---

    Results Data:
    ---
    ${results}
    ---

    Format the output with markdown for headings, lists, and bold text.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating lab report:", error);
        throw new Error("Failed to generate lab report. The AI might be busy or the content is too complex.");
    }
};

export const generateTeacherResponse = async (
    chatHistory: ChatMessage[], 
    studyHistory: HistoryItem[], 
    systemInstruction: string
): Promise<string> => {
    // To prevent token limit errors, we'll only use the most recent history items and create a lightweight summary of them.
    const recentHistory = studyHistory.slice(-15); 

    const sanitizedHistory = recentHistory.map(item => {
        const { type, timestamp } = item;
        let summary: any = { type, timestamp };

        switch(item.type) {
            case 'quiz':
                summary.topic = `Quiz on "${item.sourceContent.substring(0, 50)}..."`;
                summary.result = `${item.result.score}/${item.result.total} correct`;
                break;
            case 'summary':
                summary.topic = `Summary of "${item.sourceContent.substring(0, 50)}..."`;
                break;
            case 'diagram':
                summary.topic = `Diagram of "${item.prompt}"`;
                break;
            case 'labReport':
                summary.topic = "Lab Report created";
                break;
            case 'codeExplanation':
                summary.topic = `Explanation for code snippet`;
                break;
            case 'roadmap':
                summary.topic = `Roadmap for "${item.sourceContent.substring(0, 50)}..."`;
                break;
            case 'codeFlowchart':
                summary.topic = `Flowchart for code snippet`;
                break;
            case 'chat':
                const lastUserMsg = item.messages.filter(m => m.role === 'user').pop();
                summary.topic = `Previous chat about "${lastUserMsg ? lastUserMsg.content.substring(0, 50) + '...' : 'a topic'}"`;
                break;
             case 'audioSummary':
                summary.topic = `Audio Summary of "${item.sourceContent.substring(0, 50)}..."`;
                break;
            default:
                break;
        }
        return summary;
    });

    const studyContext = JSON.stringify(sanitizedHistory, null, 2); // Use pretty print for better AI parsing

    const fullSystemInstruction = `${systemInstruction}

You also have access to a summary of the user's recent study history, provided in JSON format below. Use this summary for context to understand what the user has been working on. If a question seems related to a history item, you can refer to it. If a question isn't related, politely guide them back to their study material. Be friendly and encouraging.

STUDY HISTORY CONTEXT SUMMARY:
---
${studyContext}
---
`;

    // The `contents` array for a multi-turn conversation must alternate roles, starting with 'user'.
    // The chat history from the UI may start with a 'model' greeting, which we need to filter out.
    let preparedChatHistory = [...chatHistory];
    if (preparedChatHistory.length > 0 && preparedChatHistory[0].role === 'model') {
        preparedChatHistory.shift();
    }
    
    // If after filtering, there are no messages, it means the user hasn't asked anything yet.
    if (preparedChatHistory.length === 0) {
        throw new Error("Cannot generate a response without a user message.");
    }
    
    const contents = preparedChatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: fullSystemInstruction,
                temperature: 0.7
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating teacher response:", error);
        throw new Error("I'm sorry, I had trouble coming up with a response. Please try asking again.");
    }
};