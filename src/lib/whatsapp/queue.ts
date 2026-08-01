import { sendWhatsAppMessageWithRetry } from "./retry";

export interface BulkJobItem {
  santriId: string;
  phone: string;
  message: string;
}

export interface BulkJobResult {
  santriId: string;
  phone: string;
  success: boolean;
  error?: string;
}

export async function processBulkWhatsAppQueue(
  items: BulkJobItem[]
): Promise<BulkJobResult[]> {
  const results: BulkJobResult[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Add 1.5s delay between messages to ensure WhatsApp socket stability during bulk sending
    if (i > 0) {
      await new Promise((res) => setTimeout(res, 1500));
    }

    try {
      if (!item.phone || item.phone.trim() === "") {
        throw new Error("Nomor WhatsApp penerima tidak boleh kosong.");
      }
      await sendWhatsAppMessageWithRetry(item.phone, item.message);
      results.push({
        santriId: item.santriId,
        phone: item.phone,
        success: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim pesan";
      results.push({
        santriId: item.santriId,
        phone: item.phone,
        success: false,
        error: msg,
      });
    }
  }

  return results;
}
