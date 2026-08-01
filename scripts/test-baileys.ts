import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import path from "path";
import pino from "pino";

async function main() {
  console.log("Initializing Baileys test...");
  const authDir = path.join(process.cwd(), ".baileys_auth_test");
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "info" }),
    printQRInTerminal: true,
    browser: ["Webapp Hafalan", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;
    console.log("Connection update:", { connection, qr: Boolean(qr) });
    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr);
      console.log("QR Data URL generated successfully! Length:", qrDataUrl.length);
      process.exit(0);
    }
  });
}

main().catch((err) => {
  console.error("Baileys Test Error:", err);
  process.exit(1);
});
