/* eslint-disable react-hooks/rules-of-hooks */
import QRCode from "qrcode";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import path from "path";
import fs from "fs";

interface BaileysState {
  sock: WASocket | null;
  qrCodeUrl: string | null;
  rawQr: string | null;
  status: "idle" | "connecting" | "qr_ready" | "connected" | "error";
  waNumber: string | null;
  connectedAt: Date | null;
}

const globalForBaileys = globalThis as unknown as {
  baileysState?: BaileysState;
};

if (!globalForBaileys.baileysState) {
  globalForBaileys.baileysState = {
    sock: null,
    qrCodeUrl: null,
    rawQr: null,
    status: "idle",
    waNumber: null,
    connectedAt: null,
  };
}

export const state = globalForBaileys.baileysState;

const AUTH_DIR = path.join(process.cwd(), ".baileys_auth");

export async function getOrInitBaileysSocket(): Promise<BaileysState> {
  if (state.sock && (state.status === "connected" || state.status === "qr_ready")) {
    return state;
  }

  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  try {
    state.status = "connecting";
    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1015901307] as [number, number, number],
    }));

    const sock = makeWASocket({
      version,
      auth: authState,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["Webapp Hafalan Santri", "Chrome", "1.0.0"],
    });

    state.sock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        state.rawQr = qr;
        try {
          state.qrCodeUrl = await QRCode.toDataURL(qr);
          state.status = "qr_ready";
        } catch {
          state.qrCodeUrl = null;
        }
      }

      if (connection === "open") {
        state.status = "connected";
        state.qrCodeUrl = null;
        state.rawQr = null;
        state.connectedAt = new Date();
        const userJid = sock.user?.id || "";
        state.waNumber = userJid.split(":")[0] || userJid.split("@")[0] || null;
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as unknown as { output?: { statusCode?: number } })?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        state.status = "idle";
        state.sock = null;
        state.qrCodeUrl = null;

        if (shouldReconnect) {
          setTimeout(() => {
            getOrInitBaileysSocket();
          }, 3000);
        } else {
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
        }
      }
    });

    return state;
  } catch {
    state.status = "error";
    state.sock = null;
    return state;
  }
}

export async function waitForQrCode(maxWaitMs = 5000): Promise<string | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (state.qrCodeUrl) return state.qrCodeUrl;
    if (state.status === "connected") return null;
    await new Promise((res) => setTimeout(res, 250));
  }
  return state.qrCodeUrl;
}

export async function ensureBaileysConnected(maxWaitMs = 8000): Promise<boolean> {
  if (state.sock && state.status === "connected") {
    return true;
  }

  const hasAuth = fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0;
  if (hasAuth || state.status === "idle" || state.status === "error") {
    await getOrInitBaileysSocket();
  }

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (state.status === "connected" && state.sock) {
      return true;
    }
    if (state.status === "error") {
      return false;
    }
    await new Promise((res) => setTimeout(res, 300));
  }

  return state.status === "connected";
}

export async function sendBaileysMessage(to: string, message: string): Promise<boolean> {
  if (!state.sock || state.status !== "connected") {
    throw new Error("WhatsApp Web (Baileys) belum terhubung via QR Code.");
  }

  const cleaned = to.replace(/\D/g, "");
  if (!cleaned || cleaned.length < 5) {
    throw new Error(`Nomor telepon '${to}' tidak valid.`);
  }

  let formattedJid = cleaned;
  if (cleaned.startsWith("0")) {
    formattedJid = `62${cleaned.slice(1)}`;
  } else if (!cleaned.startsWith("62")) {
    formattedJid = `62${cleaned}`;
  }
  const jid = `${formattedJid}@s.whatsapp.net`;

  await state.sock.sendMessage(jid, { text: message });
  return true;
}

export async function disconnectBaileys(): Promise<void> {
  if (state.sock) {
    await state.sock.logout();
    state.sock = null;
  }
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  state.status = "idle";
  state.qrCodeUrl = null;
  state.rawQr = null;
  state.waNumber = null;
}
