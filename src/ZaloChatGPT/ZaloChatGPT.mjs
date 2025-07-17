import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import express from "express"
import dotenv from "dotenv"

dotenv.config();
const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

const ZALO_TOKEN = process.env.ZALO_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/webhook', async (req, res) => {
  const data = req.body;

  try {
    const userId = data.sender.id;
    const userMessage = data.message.text;

    // Gửi message tới OpenAI
    const chatGptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const chatData = await chatGptResponse.json();
    const reply = chatData.choices?.[0]?.message?.content || "Xin lỗi, tôi không hiểu.";

    // Gửi lại phản hồi cho người dùng qua Zalo
    await fetch("https://openapi.zalo.me/v2.0/oa/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ZALO_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: {
          user_id: userId,
        },
        message: {
          text: reply,
        },
      }),
    });

    // // Lưu vào DB bằng Prisma
    // await prisma.message.create({
    //   data: {
    //     userId,
    //     userMsg: userMessage,
    //     botReply: reply,
    //   },
    // });

    res.sendStatus(200);
  } catch (error) {
    console.error("Lỗi webhook:", error);
    res.sendStatus(500);
  }
});

app.listen(12368, () => {
  console.log('Webhook is running on port 12368');
});
