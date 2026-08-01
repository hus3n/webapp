import { sendTextMessage, WhatsAppResponse } from "./client";
import { state, sendBaileysMessage, ensureBaileysConnected } from "./baileys";

export async function sendWhatsAppMessageWithRetry(
  to: string,
  message: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<WhatsAppResponse> {
  // Try to ensure Baileys is connected (auto-connect from .baileys_auth if session exists)
  const isBaileysConnected = await ensureBaileysConnected(6000);

  // If Baileys (WhatsApp Web pairing via QR Code) is connected, send via Baileys socket
  if (isBaileysConnected && state.sock) {
    let attempt = 0;
    let lastBaileysErr: Error | null = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        await sendBaileysMessage(to, message);
        return {
          messaging_product: "whatsapp",
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `baileys_msg_${Date.now()}` }],
        };
      } catch (err: unknown) {
        lastBaileysErr = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[Baileys Send Retry] Attempt ${attempt}/${maxRetries} failed for ${to}: ${lastBaileysErr.message}`
        );
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, delayMs * attempt));
        }
      }
    }

    // If Cloud API credentials are NOT configured, throw the actual Baileys error
    const hasCloudApi = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
    if (!hasCloudApi) {
      throw new Error(
        `Gagal mengirim WhatsApp via WhatsApp Web (Baileys): ${lastBaileysErr?.message || "Koneksi terputus."}`
      );
    }
  }

  // Fallback to Cloud API / Mock mode
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      return await sendTextMessage(to, message);
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      lastError = errorObj;
      console.warn(
        `[WhatsApp Retry] Attempt ${attempt}/${maxRetries} failed for ${to}: ${errorObj.message}`
      );
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      }
    }
  }

  throw new Error(
    `Failed to send WhatsApp message to ${to} after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}
