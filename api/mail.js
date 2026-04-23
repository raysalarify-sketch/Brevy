import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, userName, activeCode } = req.body;

  // 1. 환경 변수 체크
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    return res.status(500).json({ 
      error: '메일 서버 설정(MAIL_USER, MAIL_PASS)이 누락되었습니다.',
      hint: 'Vercel 설정에서 Gmail 주소와 앱 비밀번호를 등록해 주세요.' 
    });
  }

  try {
    // 2. Gmail SMTP 설정
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 3. 메일 발송
    await transporter.sendMail({
      from: `"Brevy Studio" <${process.env.MAIL_USER}>`,
      to: to,
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mail API Error:', error);
    return res.status(500).json({ error: error.message || '메일 발송 실패' });
  }
}
