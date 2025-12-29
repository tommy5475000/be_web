import crypto from "crypto";
import { saveBillsToDatabase } from "../invoiceKiot.mjs";

// SECRET_BASE64 chính là cái bạn đã gửi khi đăng ký webhook (đã Base64)
const SECRET_BASE64 = process.env.KIOT_WEBHOOK_SECRET_BASE64;

const verifySignature = (req) => {
  const sig = req.headers["x-hub-signature"]; // theo docs
  if (!sig || !req.rawBody) return false;

  // HMAC SHA-256 với key = secret base64 (không decode)
  const hash = crypto
    .createHmac("sha256", SECRET_BASE64)
    .update(req.rawBody)
    .digest("hex");

  return sig === hash;
};

export const billsApi = async (req, res) => {
  try {
    if (!verifySignature(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Notifications } = req.body || {};
    if (!Array.isArray(Notifications) || Notifications.length === 0) {
      return res.status(200).json({ ok: true, note: "No notifications" });
    }

    let totalBills = 0;

    for (const n of Notifications) {
      if (n?.Action !== "invoice.update") continue;
      const bills = Array.isArray(n?.Data) ? n.Data : [];
      totalBills += bills.length;
      if (bills.length) await saveBillsToDatabase(bills);
    }

    return res.status(200).json({ ok: true, totalBills });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};