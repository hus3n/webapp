const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{ type: "text"; text: string }>;
}

export interface WhatsAppMessage {
  to: string;
  type: "text" | "template";
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: WhatsAppTemplateComponent[];
  };
}

export interface WhatsAppResponse {
  messaging_product: "whatsapp";
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

const API_BASE = "https://graph.facebook.com/v20.0";

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function sendWhatsAppMessage(
  message: WhatsAppMessage
): Promise<WhatsAppResponse> {
  const phoneId = process.env.WHATSAPP_PHONE_ID || WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;

  if (!token || !phoneId) {
    throw new Error(
      "WhatsApp belum terhubung! Silakan scan QR Code pada menu Hubungkan WhatsApp terlebih dahulu."
    );
  }

  const response = await fetch(`${API_BASE}/${phoneId}/messages`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(message),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    throw new Error(`WhatsApp API Error: ${error.error?.message || response.statusText}`);
  }

  return data as WhatsAppResponse;
}

export async function sendTextMessage(
  to: string,
  body: string
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to: formatPhoneNumber(to),
    type: "text",
    text: { body },
  });
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components?: WhatsAppTemplateComponent[]
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to: formatPhoneNumber(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }
  if (!cleaned.startsWith("62")) {
    return `62${cleaned}`;
  }
  return cleaned;
}