import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Reverting to default (v1beta) to match the debug model list
    const model = genAI.getGenerativeModel(
      { model: "gemini-flash-latest" }
    );

    const combinedMessages = [...messages];
    if (system && combinedMessages.length > 0 && combinedMessages[0].role === 'user') {
      combinedMessages[0].content = `[INSTRUCTION]\n${system}\n\n[REQUEST]\n${combinedMessages[0].content}`;
    }

    const userMessage = combinedMessages[combinedMessages.length - 1].content;
    const history = combinedMessages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      content: [{ text: text }]
    });
  } catch (error) {
    console.error('Gemini SDK Error:', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || 'Failed to connect to Antigravity(Gemini) engine' 
      } 
    });
  }
}
