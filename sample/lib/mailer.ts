import nodemailer from 'nodemailer';

export function createSmtpTransport() {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.EMAIL_SERVER_PORT || 465);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      'Missing email SMTP env vars (EMAIL_SERVER_HOST/USER/PASSWORD)'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendSignupEmail(params: {
  to: string;
  signupUrl: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error('Missing EMAIL_FROM');

  const transport = createSmtpTransport();

  const subject = 'Finish creating your ArticleAlchemist account';
  const text = `Finish creating your ArticleAlchemist account:\n\n${params.signupUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
      <h2 style="margin:0 0 12px 0;">Finish creating your ArticleAlchemist account</h2>
      <p style="margin:0 0 16px 0;">Click the button below to set your name and password.</p>
      <p style="margin:0 0 20px 0;">
        <a href="${params.signupUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#111827;color:#ffffff;text-decoration:none;">Create account</a>
      </p>
      <p style="margin:0;color:#6b7280;font-size:12px;">If you did not request this, you can ignore this email.</p>
      <p style="margin:12px 0 0 0;color:#6b7280;font-size:12px;">Or paste this link into your browser: ${params.signupUrl}</p>
    </div>
  `.trim();

  await transport.sendMail({
    from,
    to: params.to,
    subject,
    text,
    html,
  });
}


