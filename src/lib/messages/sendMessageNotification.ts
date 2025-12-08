import { resend } from "@/lib/resend";
import User from "@/models/User";
import MessageThread from "@/models/MessageThread";
import mongoose from "mongoose";
import { logError } from "@/lib/errorLogger";

const SYSTEM_SENDER_ID = "000000000000000000000000";

/**
 * Sends email notification to recipients when a new message is added to a thread.
 * Only sends to participants who are not the sender, and skips system messages.
 * 
 * @param threadId - The ID of the message thread
 * @param senderId - The ID of the user who sent the message
 * @param messageContent - The content of the message
 * @returns Promise that resolves when notification attempt is complete (non-blocking)
 */
export async function sendMessageNotification(
  threadId: string,
  senderId: string | mongoose.Types.ObjectId,
  messageContent: string
): Promise<void> {
  try {
    // Skip system messages
    const senderIdString = senderId instanceof mongoose.Types.ObjectId 
      ? senderId.toString() 
      : String(senderId);
    
    if (senderIdString === SYSTEM_SENDER_ID || !senderIdString) {
      return;
    }

    // Get the thread with populated data
    interface PopulatedThread {
      participants: Array<{ _id: mongoose.Types.ObjectId; name?: string; email?: string } | mongoose.Types.ObjectId>;
      listingId?: { _id: mongoose.Types.ObjectId; title?: string } | mongoose.Types.ObjectId | null;
      requestId?: { _id: mongoose.Types.ObjectId; title?: string } | mongoose.Types.ObjectId | null;
    }

    const thread = (await MessageThread.findById(threadId)
      .populate("participants", "_id name email")
      .populate("listingId", "title")
      .populate("requestId", "title")
      .lean()) as PopulatedThread | null;

    if (!thread) {
      await logError({
        message: `Thread ${threadId} not found when sending message notification`,
        route: "sendMessageNotification",
        severity: "medium",
        metadata: { threadId, senderId: senderIdString },
      });
      return;
    }

    // Get sender info
    interface Sender {
      _id: mongoose.Types.ObjectId;
      name?: string;
      email?: string;
    }
    const sender = (await User.findById(senderIdString, "name email").lean()) as Sender | null;
    if (!sender) {
      await logError({
        message: `Sender ${senderIdString} not found when sending message notification`,
        route: "sendMessageNotification",
        severity: "medium",
        metadata: { threadId, senderId: senderIdString },
      });
      return;
    }

    const senderName = sender.name || "Someone";

    // Find recipients (participants who are not the sender)
    const recipientIds = (thread.participants || [])
      .map((p) => {
        const id = typeof p === "object" && p !== null && "_id" in p ? p._id.toString() : p.toString();
        return id;
      })
      .filter((id: string) => id !== senderIdString);

    if (recipientIds.length === 0) {
      // No recipients to notify
      return;
    }

    // Fetch recipient users with email addresses
    interface Recipient {
      _id: mongoose.Types.ObjectId;
      name?: string;
      email?: string;
    }
    const recipients = (await User.find(
      { _id: { $in: recipientIds }, email: { $exists: true, $ne: null } },
      "_id name email"
    ).lean()) as Recipient[];

    if (recipients.length === 0) {
      // No recipients with email addresses
      return;
    }

    // Determine context (listing or request title)
    let contextTitle = "";
    if (thread.listingId) {
      const listing = thread.listingId;
      contextTitle = (typeof listing === "object" && listing !== null && "title" in listing && typeof listing.title === "string") 
        ? listing.title 
        : "a listing";
    } else if (thread.requestId) {
      const request = thread.requestId;
      contextTitle = (typeof request === "object" && request !== null && "title" in request && typeof request.title === "string")
        ? request.title
        : "a disc request";
    }

    // Determine "from" email based on environment
    const fromEmail =
      process.env.NODE_ENV === "production"
        ? process.env.RESEND_FROM_PROD!
        : process.env.RESEND_FROM_DEV!;

    if (!fromEmail) {
      await logError({
        message: "RESEND_FROM_PROD or RESEND_FROM_DEV not configured",
        route: "sendMessageNotification",
        severity: "high",
        metadata: { threadId, senderId: senderIdString, nodeEnv: process.env.NODE_ENV },
      });
      return;
    }

    // Get base URL for links
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const threadUrl = `${baseUrl}/messages/${threadId}`;

    // Truncate message preview (first 150 characters)
    const messagePreview =
      messageContent.length > 150
        ? messageContent.substring(0, 150) + "..."
        : messageContent;

    // Send email to each recipient
    const emailPromises = recipients.map(async (recipient: Recipient) => {
      if (!recipient.email) return;

      const recipientName = recipient.name || "there";

      try {
        await resend.emails.send({
          from: fromEmail,
          to: recipient.email,
          subject: contextTitle
            ? `New message from ${senderName} about ${contextTitle}`
            : `New message from ${senderName}`,
          text: `
Hi ${recipientName},

You received a new message from ${senderName}${contextTitle ? ` about ${contextTitle}` : ""}.

Message:
"${messagePreview}"

View and reply: ${threadUrl}

---
DiscNest
          `.trim(),
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; color: #2563eb; font-size: 24px;">New Message</h1>
  </div>
  
  <p>Hi ${recipientName},</p>
  
  <p>You received a new message from <strong>${senderName}</strong>${contextTitle ? ` about <strong>${contextTitle}</strong>` : ""}.</p>
  
  <div style="background-color: #f1f5f9; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; font-style: italic;">"${messagePreview.replace(/"/g, "&quot;")}"</p>
  </div>
  
  <div style="margin: 30px 0; text-align: center;">
    <a href="${threadUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View and Reply</a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #6b7280; font-size: 14px; margin: 0;">
    DiscNest - Your disc golf marketplace
  </p>
</body>
</html>
          `.trim(),
        });
      } catch (error) {
        // Log individual email send failures (non-blocking)
        await logError({
          error,
          message: `Failed to send message notification email to ${recipient.email}`,
          route: "sendMessageNotification",
          severity: "medium",
          metadata: {
            threadId,
            senderId: senderIdString,
            recipientId: recipient._id.toString(),
            recipientEmail: recipient.email,
          },
        }).catch((logErr) => {
          // Fallback to console if error logging fails
          console.error(
            `[sendMessageNotification] Failed to send email to ${recipient.email}:`,
            error
          );
        });
        // Don't throw - we want to continue sending to other recipients
      }
    });

    await Promise.allSettled(emailPromises);
  } catch (error) {
    // Log error but don't throw - email notification failure shouldn't break message creation
    await logError({
      error,
      message: "Error sending message notifications",
      route: "sendMessageNotification",
      severity: "high",
      metadata: { threadId, senderId: String(senderId) },
    }).catch((logErr) => {
      // Fallback to console if error logging fails
      console.error("[sendMessageNotification] Error sending notifications:", error);
    });
  }
}

