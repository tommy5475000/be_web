import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

let ZALO_TOKEN = process.env.ZALO_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/webhook", async (req, res) => {
  const data = req.body;

  try {
    const userId = data.sender?.id;
    const userMessage = data.message?.text;

    if (!userId || !userMessage) {
      console.warn("Payload Zalo không hợp lệ:", data);
      return res.sendStatus(400);
    }

    // Gửi message tới OpenAI
    const chatGptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: userMessage }],
        }),
      }
    );

    const chatData = await chatGptResponse.json();
    if (!chatData.choices || !chatData.choices[0]) {
      console.error("Lỗi phản hồi từ OpenAI:", chatData);
      return res.sendStatus(500);
    }

    const reply =
      chatData.choices[0].message.content || "Xin lỗi, tôi không hiểu.";

    // Gửi phản hồi qua Zalo
    let zaloResponse = await sendZaloMessage(ZALO_TOKEN, userId, reply);

    // Nếu token hết hạn thì tự động refresh
    if (zaloResponse.error === -216) {
      console.warn("Zalo token hết hạn. Đang refresh...");
      const newToken = await refreshAccessToken();
      if (newToken) {
        ZALO_TOKEN = newToken;
        process.env.ZALO_ACCESS_TOKEN = newToken;
        zaloResponse = await sendZaloMessage(ZALO_TOKEN, userId, reply);
      } else {
        console.error("Không thể refresh token Zalo");
        return res.sendStatus(500);
      }
    }

    async function sendZaloMessage(token, userId, message) {
      const response = await fetch("https://openapi.zalo.me/v2.0/oa/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: { user_id: userId },
          message: { text: message },
        }),
      });

      return await response.json();
    }

    async function refreshAccessToken() {
      try {
        const response = await fetch(
          "https://oauth.zaloapp.com/v4/oa/access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              secret_key: process.env.ZALO_APP_SECRET, // BẮT BUỘC
            },
            body: new URLSearchParams({
              app_id: process.env.ZALO_APP_ID,
              grant_type: "refresh_token",
              refresh_token: process.env.ZALO_REFRESH_TOKEN,
            }),
          }
        );

        const data = await response.json();

        if (data.access_token) {
          const envPath = "./.env";
          let envContent = fs.readFileSync(envPath, "utf8");
          envContent = envContent.replace(
            /ZALO_ACCESS_TOKEN=.*/g,
            `ZALO_ACCESS_TOKEN=${data.access_token}`
          );
          fs.writeFileSync(envPath, envContent);
          console.log("✅ Đã cập nhật ZALO_ACCESS_TOKEN trong .env");

          return data.access_token;
        } else {
          console.error("❌ Không nhận được access_token mới:", data);
          return null;
        }
      } catch (error) {
        console.error("❌ Lỗi khi refresh token:", error);
        return null;
      }
    }

    // Lưu vào DB
    await prisma.message.create({
      data: {
        userId,
        userMsg: userMessage,
        botReply: reply,
      },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Lỗi webhook:", error);
    res.sendStatus(500);
  }
});

app.listen(12368, "0.0.0.0", () => {
  console.log("Webhook is running on port 12368");
});
