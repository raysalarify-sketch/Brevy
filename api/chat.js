import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API_KEY_MISSING',
      message: 'GEMINI_API_KEY가 서버에 등록되지 않았습니다.',
      hint: 'Vercel Settings > Environment Variables에서 정확히 GEMINI_API_KEY 이름으로 등록했는지 확인해 주세요.'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ... (logic remains same)
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
        maxOutputTokens: 3500,
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
    console.error('AI SDK Error:', error);
    return res.status(500).json({ 
      error: 'AI_API_FAILURE',
      message: 'AI 엔진 응답 실패',
      details: error.message || '알 수 없는 오류',
      hint: 'API 키가 유효하지 않거나 할당량이 초과되었을 수 있습니다.'
    });
  }
}
