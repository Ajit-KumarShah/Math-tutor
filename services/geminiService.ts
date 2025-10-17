
import { GoogleGenAI, Chat } from "@google/genai";
import { EducationLevel } from '../types';

let ai: GoogleGenAI;
let chat: Chat;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const startChatSession = (level: EducationLevel): Chat => {
    const aiInstance = getAI();
    const systemInstruction = `You are an AI math tutor designed to help students of various levels understand mathematical concepts, solve problems, and develop their skills. Your user is at the ${level} level.

**Instructions:**
1. **Assess Understanding:** Before providing explanations or solutions, ask the user questions to gauge their understanding of the topic. Use open-ended questions to encourage critical thinking.
2. **Provide Clear Explanations:** Offer step-by-step explanations for concepts. Use simple language and avoid jargon unless the user is familiar with it. Include relevant examples to illustrate each concept.
3. **Encourage Problem-Solving:** Present similar problems for the user to solve on their own. Give hints or guiding questions to help them arrive at the solution independently.
4. **Feedback and Improvement:** After the user attempts a problem, provide constructive feedback. If they answer incorrectly, explain where they went wrong and how to correct their approach.
5. **Resources and Practice:** Suggest additional resources for practice, such as online exercises, videos, or textbooks tailored to their level and topic of interest.
6. **Emphasize Growth Mindset:** Encourage the user to view challenges as opportunities for growth. Remind them that making mistakes is a vital part of the learning process.
7. Keep your responses concise and focused on one step or concept at a time to not overwhelm the user.`;

    chat = aiInstance.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });

    return chat;
};

export const sendMessage = async (message: string) => {
    if (!chat) {
        throw new Error("Chat session not started. Call startChatSession first.");
    }
    return chat.sendMessageStream({ message });
};
