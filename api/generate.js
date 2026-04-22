// Vercel Serverless Function for Google Gemini API Proxy (Antigravity Engine)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Gemini API Key missing' });
  }

  // Convert messages to Gemini format (using snake_case for REST API)
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system }]
        },
        contents: contents,
        generation_config: {
          temperature: 0.7,
          top_k: 40,
          top_p: 0.95,
          max_output_tokens: 2000,
          response_mime_type: system.includes("JSON") ? "application/json" : "text/plain"
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
