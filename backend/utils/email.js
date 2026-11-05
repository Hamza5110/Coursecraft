import nodemailer from "nodemailer";

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      return nodemailer.createTransport({
        pool: true,
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        requireTLS: Number(SMTP_PORT) !== 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }

    const testAccount = await nodemailer.createTestAccount();
    console.log(
      "[email] No SMTP env set — using Ethereal test account:",
      testAccount.user,
    );
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      requireTLS: true,
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

  if (process.env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("[email] Preview URL:", previewUrl);
    }
  }

  return info;
}
