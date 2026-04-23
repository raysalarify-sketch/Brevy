import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ 
      error: 'RESEND_API_KEY가 설정되지 않았습니다.',
      hint: 'Vercel Dashboard > Settings > Environment Variables에서 RESEND_API_KEY를 추가하고 Redeploy 해주세요.' 
    });
  }

  const { to, userName, activeCode } = req.body;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = await resend.emails.send({
      from: 'Brevy Studio <onboarding@resend.dev>',
      to: [to],
      subject: '[Brevy] 입장 코드 안내드립니다.',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 24px;">Brevy Prompt Studio</h1>
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">안녕하세요, <strong>${userName}</strong>님.</p>
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">Brevy의 비즈니스 프롬프트 최적화 서비스 입장 요청이 승인되었습니다.</p>
          
          <div style="background: #f9fafb; padding: 32px; border-radius: 12px; text-align: center; margin: 32px 0;">
            <span style="font-size: 14px; color: #6b7280; display: block; margin-bottom: 8px;">입장 코드</span>
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #4f46e5;">${activeCode}</span>
          </div>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">아래 버튼을 눌러 접속하신 후, 위 코드를 입력해 주세요.</p>
          
          <a href="https://brevy-lmvf.vercel.app" style="display: inline-block; background: #111827; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">서비스 바로가기</a>
          
          <hr style="margin: 40px 0; border: 0; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #9ca3af;">본 메일은 발신 전용입니다. 문의 사항은 관리자에게 직접 연락 부탁드립니다.</p>
        </div>
      `,
    });

    if (data.error) {
       return res.status(400).json({ error: data.error.message || 'Resend API 오류' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Mail API Error:', error);
    return res.status(500).json({ error: error.message || '알 수 없는 서버 오류' });
  }
}
