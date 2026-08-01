import { NextRequest, NextResponse } from "next/server";
import { parseAndExecuteCommand } from "@/lib/whatsapp/commands";
import { sendTextMessage } from "@/lib/whatsapp/client";

// Verification endpoint for WhatsApp Meta Webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "your-verify-token";

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Handle incoming messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a message event from WhatsApp Meta API
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages?.[0]) {
      const message = value.messages[0];
      const from = message.from; // Sender phone number
      const messageBody = message.text?.body;

      if (messageBody) {
        // Parse & execute command
        const replyText = await parseAndExecuteCommand(from, messageBody);
        // Reply back
        await sendTextMessage(from, replyText);
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
