const BRAND = {
  name: 'PIGBIT',
  primary: '#E84A86',
  background: '#F3F4F6',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  soft: '#FDF2F8',
  softBorder: '#FBCFE8',
};

function wrapHtml(title: string, body: string) {
  return `
  <div style="background:${BRAND.background};padding:40px 16px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid ${BRAND.border};border-radius:16px;">
      <tr>
        <td style="padding:28px 24px 0 24px;text-align:center;">
          <div style="font-weight:800;letter-spacing:3px;font-size:18px;color:${BRAND.primary};">
            ${BRAND.name}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 24px 0 24px;text-align:center;">
          <h1 style="margin:0;font-size:20px;color:${BRAND.text};font-weight:700;">${title}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 24px 24px;">
          ${body}
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px 24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${BRAND.muted};">
            Se você não solicitou este código, ignore este e-mail.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

function codeBlock(code: string) {
  return `
  <div style="text-align:center;margin:16px 0;">
    <div style="display:inline-block;background:${BRAND.soft};border:1px solid ${BRAND.softBorder};padding:12px 24px;border-radius:999px;font-size:22px;letter-spacing:4px;font-weight:700;color:${BRAND.text};">
      ${code}
    </div>
  </div>
  `;
}

export function verificationEmail(code: string) {
  const title = 'Código de verificação';
  const text = `Seu código de verificação é: ${code}. Válido por 15 minutos.`;
  const html = wrapHtml(
    title,
    `
      <p style="margin:0 0 8px 0;color:${BRAND.muted};text-align:center;line-height:1.5;">
        Use este código para concluir seu acesso.
      </p>
      ${codeBlock(code)}
      <p style="margin:0;color:${BRAND.muted};text-align:center;line-height:1.5;">
        Válido por 15 minutos.
      </p>
    `,
  );
  return { subject: `${BRAND.name} - Código de verificação`, text, html };
}

export function passwordResetEmail(code: string) {
  const title = 'Recuperação de senha';
  const text = `Código para redefinir senha: ${code}. Válido por 15 minutos.`;
  const html = wrapHtml(
    title,
    `
      <p style="margin:0 0 8px 0;color:${BRAND.muted};text-align:center;line-height:1.5;">
        Use este código para redefinir sua senha.
      </p>
      ${codeBlock(code)}
      <p style="margin:0;color:${BRAND.muted};text-align:center;line-height:1.5;">
        Válido por 15 minutos.
      </p>
    `,
  );
  return { subject: `${BRAND.name} - Recuperação de senha`, text, html };
}
