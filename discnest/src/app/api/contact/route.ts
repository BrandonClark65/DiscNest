import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const toEmail = process.env.ADMIN_EMAIL;
    if (!toEmail) {
      return NextResponse.json(
        { error: 'ADMIN_EMAIL not configured' },
        { status: 500 }
      );
    }

    // ✅ Use Resend's sandbox domain for local dev, your verified domain in production
    const fromEmail =
        process.env.NODE_ENV === 'production'
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
  } catch (err) {
    console.error('Error sending contact form email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
