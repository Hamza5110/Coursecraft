import nodemailer from "nodemailer";

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    }

    // Dev fallback: Ethereal test account (logs preview URL)
    const testAccount = await nodemailer.createTestAccount();
    console.log(
      "[email] No SMTP env set — using Ethereal test account:",
      testAccount.user,
    );
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  })();

  return transporterPromise;
}

export async function sendMail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    '"Blog Verse" <noreply@blogverse.local>';

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("[email] Preview URL:", previewUrl);
  }

  return info;
}
