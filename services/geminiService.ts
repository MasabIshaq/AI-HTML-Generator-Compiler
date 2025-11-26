import { GoogleGenAI, Modality, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
let htmlChatSession: Chat | null = null;
let chatbotSession: Chat | null = null;

const SYSTEM_INSTRUCTION_HTML = "You are an expert HTML code generator. You will be given a description of a web page or component. Your task is to generate a single, complete, clean, and valid HTML file content. Do not include any explanations, markdown formatting (like ```html), or any text other than the raw HTML code itself. The output must start with <!DOCTYPE html> and be directly renderable in a browser. Include professional, modern inline CSS using a <style> tag in the <head> for excellent visual aesthetics. Use a modern color palette and ensure good responsive design practices. When the user asks for changes, you MUST modify the PREVIOUS HTML code you generated to incorporate the changes and return the full updated HTML. ALWAYS return only the full HTML code.";

export const generateOrUpdateHtmlCode = async (prompt: string): Promise<string> => {
    try {
        if (!htmlChatSession) {
            htmlChatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION_HTML
                }
            });
        }
        
        const response = await htmlChatSession.sendMessage({ message: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating/updating HTML:", error);
        resetHtmlChatSession(); // Reset on error to allow starting a fresh session
        throw new Error("Failed to communicate with the model. The session has been reset.");
    }
};

export const resetHtmlChatSession = () => {
    htmlChatSession = null;
};

const SYSTEM_INSTRUCTION_CHATBOT = "You are an AI assistant from Pixel Dragon, also known as Go Projects. Your owner is Masab Ishaq from Pakistan. When asked who you are, you must respond with: 'I am a large language model, trained by Pixel Dragon. Also known as Go Projects. My owner is Masab Ishaq from Pakistan'. You specialize in web development and frontend engineering. Answer questions concisely and provide code examples when relevant.";

export const askChatbot = async (prompt: string): Promise<string> => {
    try {
        if (!chatbotSession) {
            chatbotSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION_CHATBOT
                }
            });
        }
        const response = await chatbotSession.sendMessage({ message: prompt });
        return response.text;
    } catch (error) {
        console.error("Error communicating with chatbot:", error);
        chatbotSession = null;
        throw new Error("Failed to get a response from the chatbot. Please try again.");
    }
};


export const generateSpeechFromText = async (text: string): Promise<string> => {
    try {
        // Strip HTML tags for clearer speech, but keep content. A simple regex approach.
        const plainText = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, 'The page contains custom styling. ')
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ').trim();

        if (plainText.length === 0) {
            throw new Error("No text content to read from the HTML.");
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Read the following web page content: ${plainText}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech. The model might be unavailable.");
    }
};