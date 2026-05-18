import { GoogleGenerativeAI } from '@google/generative-ai';

export const getChatResponse = async (history, drivingMode = false, contextData = {}) => {
  // Check for API key and initialize client
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Gemini API key not configured');
    return "AI service is not configured. Please add GEMINI_API_KEY to your .env file.";
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  let systemPrompt = drivingMode
    ? "You are a parking assistant. The user is driving. Keep responses extremely short (under 20 words). Focus on navigation and availability."
    : "You are a smart parking assistant. Help the user find parking, check rates, and features.";

  // Inject context data (spots and user location)
  if (contextData && contextData.spots) {
    const spotsInfo = contextData.spots.map(s =>
      `- ${s.name}: $${s.pricePerHour}/hr, ${s.availableSpots} spots open, ${s.distance ? s.distance.toFixed(1) + 'km away' : 'distance unknown'}. Features: ${s.features.join(', ')}.`
    ).join('\n');

    systemPrompt += `\n\nHere is the real-time data for available parking spots:\n${spotsInfo}\n\nUser Location: ${JSON.stringify(contextData.userLocation || 'Unknown')}\n\nUse this data to answer questions about nearest, cheapest, or specific spots. If the user asks for a recommendation, suggest the best option based on their criteria (price, distance, availability).`;
  }

  try {
    // Use gemini-2.0-flash which is available to this API key
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build the full prompt with system context and user message
    const lastUserMessage = history[history.length - 1]?.content || '';
    const fullPrompt = `${systemPrompt}\n\nUser: ${lastUserMessage}\n\nAssistant:`;

    // Generate content directly
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    console.error("Error details:", error.message);
    return "I'm having trouble connecting to the AI service. The model may not be available with your API key.";
  }
};

// Audio processing is disabled for Gemini
// Gemini has different audio capabilities that would require a different implementation
export const processAudio = async (filePath) => {
  throw new Error('Audio processing is not available with Gemini. Please use text-based chat instead.');
};
