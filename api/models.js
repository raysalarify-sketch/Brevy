import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key missing in environment' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    return res.status(200).json({
      message: "Available models for your API key",
      models: data.models || [],
      raw: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
