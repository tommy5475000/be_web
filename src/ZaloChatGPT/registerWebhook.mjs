// registerWebhook.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const ZALO_ACCESS_TOKEN = process.env.ZALO_ACCESS_TOKEN;

async function registerWebhook() {
  const res = await fetch("https://openapi.zalo.me/v2.0/oa/webhook/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZALO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      url: "https://shophagia.online:12368/webhook", // thay bằng domain của bạn
    }),
  });

  // 🧪 Xem toàn bộ text Zalo trả về
const text = await res.text();
console.log("🔍 Zalo response (raw):", text);

  const data = await res.json();
  console.log("✅ Kết quả đăng ký:", data);
}

registerWebhook();
