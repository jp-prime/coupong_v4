import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const body = await request.json();
        const { companyName, managerName, phoneNumber, email, businessType, message } = body;

        // 필수 항목 검증
        if (!companyName || !phoneNumber || !email) {
            return Response.json(
                { success: false, error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        // 관리자에게 보내는 이메일
        const adminMailOptions = {
            from: `"쿠퐁온라인 알림" <${process.env.SMTP_EMAIL}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `[쿠퐁온라인] 🏪 신규 입점신청 - ${companyName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f1f5f9; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .card { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                        .header { text-align: center; margin-bottom: 32px; }
                        .badge { display: inline-block; background: linear-gradient(135deg, #a855f7, #7e22ce); color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px; }
                        .title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
                        .divider { height: 1px; background: #f1f5f9; margin: 24px 0; }
                        .field { margin-bottom: 16px; }
                        .field-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                        .field-value { font-size: 16px; font-weight: 600; color: #1e293b; padding: 12px 16px; background: #f8fafc; border-radius: 10px; border-left: 3px solid #a855f7; }
                        .message-box { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px; margin-top: 8px; }
                        .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 13px; }
                        .time { color: #64748b; font-size: 13px; margin-top: 4px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="header">
                                <div class="badge">🏪 신규 입점 신청</div>
                                <h1 class="title">입점 신청서가 접수되었습니다</h1>
                                <div class="time">접수 시간: ${now}</div>
                            </div>
                            <div class="divider"></div>

                            <div class="field">
                                <div class="field-label">상호명 / 업소명</div>
                                <div class="field-value">🏪 ${companyName}</div>
                            </div>

                            <div class="field">
                                <div class="field-label">담당자명</div>
                                <div class="field-value">👤 ${managerName || '미입력'}</div>
                            </div>

                            <div class="field">
                                <div class="field-label">연락처</div>
                                <div class="field-value">📱 ${phoneNumber}</div>
                            </div>

                            <div class="field">
                                <div class="field-label">이메일</div>
                                <div class="field-value">📧 ${email}</div>
                            </div>

                            <div class="field">
                                <div class="field-label">업종</div>
                                <div class="field-value">🏷️ ${businessType || '미입력'}</div>
                            </div>

                            ${message ? `
                            <div class="field">
                                <div class="field-label">추가 메시지</div>
                                <div class="message-box">💬 ${message}</div>
                            </div>
                            ` : ''}

                            <div class="divider"></div>
                            <div class="footer">
                                이 메일은 쿠퐁온라인 입점 신청 시스템에서 자동으로 발송되었습니다.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        // 신청자에게 보내는 확인 이메일
        const applicantMailOptions = {
            from: `"쿠퐁온라인" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: `[쿠퐁온라인] 입점 신청이 접수되었습니다 🎉`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f1f5f9; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .card { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                        .header { text-align: center; margin-bottom: 32px; }
                        .icon { font-size: 48px; margin-bottom: 16px; }
                        .title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 8px; }
                        .subtitle { color: #64748b; font-size: 15px; }
                        .info-box { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 24px 0; }
                        .info-item { display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; }
                        .info-label { color: #94a3b8; font-weight: 600; min-width: 80px; }
                        .info-value { color: #1e293b; font-weight: 700; }
                        .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 13px; }
                        .btn { display: inline-block; background: linear-gradient(135deg, #a855f7, #7e22ce); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 16px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="header">
                                <div class="icon">✅</div>
                                <h1 class="title">신청이 접수되었습니다!</h1>
                                <p class="subtitle">${companyName} 사장님, 신청해 주셔서 감사합니다.</p>
                            </div>

                            <p style="color: #475569; line-height: 1.7; font-size: 15px;">
                                입점 신청서를 검토한 후, <strong>2~3 영업일 내</strong>에 
                                담당자가 연락드릴 예정입니다.
                            </p>

                            <div class="info-box">
                                <div style="font-weight: 800; color: #7e22ce; margin-bottom: 12px; font-size: 13px;">📋 접수된 정보</div>
                                <div class="info-item">
                                    <span class="info-label">상호명</span>
                                    <span class="info-value">${companyName}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">연락처</span>
                                    <span class="info-value">${phoneNumber}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">이메일</span>
                                    <span class="info-value">${email}</span>
                                </div>
                            </div>

                            <p style="color: #475569; line-height: 1.7; font-size: 14px;">
                                문의사항이 있으시면 카카오톡으로 연락주세요.<br>
                                <strong style="color: #7e22ce;">카카오톡: 쿠퐁온라인</strong>
                            </p>

                            <div class="footer">
                                베트남 교민 쿠폰 플랫폼 | 쿠퐁온라인<br>
                                이 메일은 자동 발송되었습니다.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        // 두 이메일 동시 발송
        await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(applicantMailOptions),
        ]);

        return Response.json({ success: true, message: '이메일 전송 성공' });

    } catch (error) {
        console.error('이메일 전송 오류:', error);
        return Response.json(
            { success: false, error: '이메일 전송에 실패했습니다.' },
            { status: 500 }
        );
    }
}
