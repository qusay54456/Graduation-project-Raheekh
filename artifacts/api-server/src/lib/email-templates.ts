const NAVY = "#1a2b4a";
const GREEN = "#00b359";
const LIGHT_BG = "#f4f6fa";
const TEXT = "#2d3748";
const MUTED = "#6b7280";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(opts: { title: string; bodyHtml: string; preheader?: string }): string {
  const preheader = opts.preheader ? escapeHtml(opts.preheader) : "";
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${LIGHT_BG};font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:${TEXT};direction:rtl;">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT_BG};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,43,74,0.08);">
      <tr>
        <td style="background:${NAVY};padding:28px 24px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
            <td style="background:#ffffff;width:48px;height:48px;border-radius:12px;text-align:center;vertical-align:middle;font-weight:800;font-size:24px;color:${NAVY};font-family:Arial,sans-serif;">P</td>
            <td style="width:12px;"></td>
            <td style="color:#ffffff;font-size:24px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:0.5px;">ParkNow</td>
          </tr></table>
          <div style="color:#cfd6e4;font-size:13px;margin-top:10px;">منصة حجز مواقف السيارات في فلسطين</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px 16px 28px;">
          ${opts.bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 28px 28px;">
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="color:${MUTED};font-size:12px;line-height:1.7;margin:0;text-align:center;">
            هذه رسالة آلية، لا حاجة للرد عليها.<br/>
            <span style="direction:ltr;display:inline-block;">© ParkNow · Palestine</span>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto;">
    <tr><td style="background:${GREEN};border-radius:10px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

export function welcomeEmailTemplate(opts: { name: string; email: string; appUrl?: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = "أهلاً وسهلاً في ParkNow";
  const appUrl = opts.appUrl ?? "";

  const text = `أهلاً وسهلاً ${opts.name} في ParkNow!

تم إنشاء حسابك بنجاح:
الاسم: ${opts.name}
البريد: ${opts.email}

كيف تستخدم التطبيق:
1. تصفح المواقف القريبة من موقعك على الخريطة
2. اختر الموقف وحدد وقت الحجز
3. ادفع الرسوم بسهولة وأمان
4. استلم تأكيد الحجز ورمز QR
5. توجه إلى الموقف وامسح الرمز عند الدخول

نتمنى لك تجربة سهلة ومريحة!
فريق ParkNow`;

  const bodyHtml = `
    <h1 style="color:${NAVY};font-size:26px;font-weight:800;margin:0 0 8px 0;text-align:center;">أهلاً وسهلاً ${escapeHtml(opts.name)}!</h1>
    <p style="color:${TEXT};font-size:16px;line-height:1.8;margin:0 0 18px 0;text-align:center;">يسعدنا انضمامك إلى عائلة <strong style="color:${NAVY};">ParkNow</strong>، الحل الأذكى لحجز مواقف السيارات في فلسطين.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT_BG};border-radius:12px;border-right:4px solid ${GREEN};margin:18px 0;">
      <tr><td style="padding:16px 18px;">
        <div style="color:${MUTED};font-size:12px;margin-bottom:6px;">معلومات الحساب</div>
        <div style="color:${TEXT};font-size:15px;line-height:1.9;">
          <strong>الاسم:</strong> ${escapeHtml(opts.name)}<br/>
          <strong>البريد:</strong> <span style="direction:ltr;display:inline-block;">${escapeHtml(opts.email)}</span>
        </div>
      </td></tr>
    </table>

    <h2 style="color:${NAVY};font-size:18px;font-weight:700;margin:24px 0 12px 0;">كيف تستخدم ParkNow؟</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${[
        ["1", "تصفّح المواقف القريبة منك على الخريطة وشاهد الأسعار والتوفر مباشرة."],
        ["2", "اختر الموقف المناسب وحدّد وقت الحجز بكل سهولة."],
        ["3", "أكمل الحجز واحصل على تأكيد فوري مع رمز QR."],
        ["4", "توجّه للموقف، امسح الرمز عند الدخول، واستمتع بتجربة بدون انتظار."],
      ]
        .map(
          ([n, txt]) => `<tr><td style="padding:8px 0;vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:${GREEN};color:#ffffff;width:30px;height:30px;border-radius:50%;text-align:center;font-weight:800;font-family:Arial,sans-serif;font-size:14px;">${n}</td>
          <td style="width:14px;"></td>
          <td style="color:${TEXT};font-size:14px;line-height:1.7;">${escapeHtml(txt)}</td>
        </tr></table>
      </td></tr>`,
        )
        .join("")}
    </table>

    ${appUrl ? button(appUrl, "ابدأ الحجز الآن") : ""}

    <p style="color:${MUTED};font-size:13px;line-height:1.7;margin:24px 0 0 0;text-align:center;">
      إذا كان لديك أي استفسار، نحن هنا لمساعدتك في أي وقت.
    </p>
  `;

  return { subject, text, html: shell({ title: subject, bodyHtml, preheader: `مرحباً ${opts.name}، حسابك جاهز.` }) };
}

export function passwordResetEmailTemplate(opts: { code: string; minutes?: number }): {
  subject: string;
  text: string;
  html: string;
} {
  const minutes = opts.minutes ?? 10;
  const subject = "ParkNow - رمز إعادة تعيين كلمة المرور";

  const text = `طلبت إعادة تعيين كلمة المرور لحسابك في ParkNow.

رمز التحقق: ${opts.code}

صالح لمدة ${minutes} دقيقة فقط.

إذا لم تطلب هذا، يمكنك تجاهل الرسالة بأمان.

فريق ParkNow`;

  const digits = opts.code
    .split("")
    .map(
      (d) =>
        `<td style="background:#ffffff;border:2px solid ${NAVY};color:${NAVY};font-size:28px;font-weight:800;width:44px;height:54px;text-align:center;border-radius:8px;font-family:'Courier New',monospace;">${escapeHtml(
          d,
        )}</td>`,
    )
    .join('<td style="width:8px;"></td>');

  const bodyHtml = `
    <h1 style="color:${NAVY};font-size:24px;font-weight:800;margin:0 0 8px 0;text-align:center;">إعادة تعيين كلمة المرور</h1>
    <p style="color:${TEXT};font-size:15px;line-height:1.8;margin:0 0 20px 0;text-align:center;">طلبت إعادة تعيين كلمة المرور لحسابك في <strong>ParkNow</strong>. استخدم الرمز التالي لإكمال العملية:</p>

    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:18px auto;">
      <tr>${digits}</tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT_BG};border-radius:10px;margin:18px 0;">
      <tr><td style="padding:14px 18px;text-align:center;color:${TEXT};font-size:14px;">
        ⏱️ صالح لمدة <strong style="color:${NAVY};">${minutes} دقيقة</strong> فقط
      </td></tr>
    </table>

    <div style="background:#fff8e1;border-right:4px solid #f59e0b;padding:14px 18px;border-radius:8px;margin:20px 0;">
      <p style="color:#78350f;font-size:13px;line-height:1.7;margin:0;">
        <strong>تنبيه أمني:</strong> إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة. كلمة مرورك الحالية لا تزال آمنة.
      </p>
    </div>

    <p style="color:${MUTED};font-size:12px;line-height:1.7;margin:18px 0 0 0;text-align:center;">
      لا تشارك هذا الرمز مع أي شخص. فريق ParkNow لن يطلبه منك أبداً.
    </p>
  `;

  return { subject, text, html: shell({ title: subject, bodyHtml, preheader: `رمز التحقق: ${opts.code}` }) };
}
