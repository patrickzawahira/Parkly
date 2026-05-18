import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_API_KEY || '';

// Safely initialize the client only when needed to avoid crashes if key is missing during render
const getClient = () => {
  if (!apiKey) {
    console.warn("API Key is missing for Gemini");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export const generateParkingAssistance = async (
  userQuery: string,
  contextData: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "I'm sorry, I can't connect to the AI service right now. Please check your API key.";

  try {
    const systemInstruction = `
      You are a smart parking assistant for a driver. 
      You have access to the following current parking data context: ${contextData}.
      
      Your goals:
      1. Keep answers VERY short and concise (the user is driving).
      2. Help find parking based on price, distance, or features.
      3. Explain restrictions if asked.
      4. If the user wants to reserve, guide them to the reservation button.
      
      Do not use markdown formatting like bold or lists. Just plain text.
    `;

    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userQuery }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100, // Strict limit for brevity
      }
    });

    const response = result.response;
    return response.text() || "I couldn't process that request.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Return the actual error message for debugging
    if (error.message) {
      return `Error: ${error.message}`;
    }
    return "Sorry, I'm having trouble connecting to the network.";
  }
};