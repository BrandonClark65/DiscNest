import { NextResponse } from "next/server";
import { Resend } from "resend";
import { withErrorHandling } from "@/lib/withErrorHandling";

const resend = new Resend(process.env.RESEND_API_KEY);

const handler = async (req: Request) => {
  const { email, subject, message } = await req.json();

  if (!email || !subject || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const toEmail = process.env.ADMIN_EMAIL;
  if (!toEmail) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL not configured" },
      { status: 500 }
    );
  }

  // ✅ Use verified domain in production, sandbox in dev
  const fromEmail =
    process.env.NODE_ENV === "production"
      ? process.env.RESEND_FROM_PROD!
      : process.env.RESEND_FROM_DEV!;

  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `Contact Form: ${subject}`,
    replyTo: email,
    text: `
New contact form submission:

From: ${email}
Subject: ${subject}

Message:
${message}
    `,
  });

  return NextResponse.json({ success: true });
};

// ✅ Wrap the handler with error logging
export const POST = withErrorHandling(
  handler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/contact"
);
