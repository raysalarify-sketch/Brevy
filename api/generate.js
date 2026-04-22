// Vercel Serverless Function for Google Gemini API Proxy (Antigravity Engine) - SAFE MODE
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
  }

  // SAFE MODE: Combine system prompt with the first message to ensure 100% compatibility across all API versions
  const combinedMessages = [...messages];
  if (system && combinedMessages.length > 0 && combinedMessages[0].role === 'user') {
    combinedMessages[0].content = `[SYSTEM INSTRUCTION]\n${system}\n\n[USER REQUEST]\n${combinedMessages[0].content}`;
  }

  // Convert to Gemini format
  const contents = combinedMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Use stable v1 API
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2000,
          // Remove response_mime_type if it causes issues in v1, 
          // Gemini 1.5 Flash is good at following JSON instructions in text
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return res.status(200).json({
      content: [{ text: text }]
    });
  } catch (error) {
    console.error('Gemini Proxy error:', error);
    return res.status(500).json({ error: 'Failed to connect to Antigravity(Gemini) engine' });
  }
}
