import { PrismaClient } from "@prisma/client";
import axios from "axios";
import getAccessToken from "../auth.mjs";

const prisma = new PrismaClient();

export const registerWebhook = async (req, res) => {
  try {
    const { type, url, description, secret } = req.body.Webhook;

    // ✅ Kiểm tra dữ liệu đầu vào
    if (!type || !url || !description || !secret) {
      return res.status(400).json({
        message: "Missing required fields: type, url, description, or secret",
        received: { type, url, description, secret }
      });
    }
    // Lấy token từ KiotViet
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Failed to get access token");
    }

    // Mã hóa secret bằng Base64
    const encodedSecret = Buffer.from(secret).toString("base64");

    // Gọi API KiotViet để đăng ký webhook
    const kiotResponse = await axios.post(
      "https://public.kiotapi.com/webhooks",
      {
        Webhook: {
          Type: type,
          Url: url,
          IsActive: true,
          Description: description,
          Secret: encodedSecret,
        },
      },
      {
        headers: {
          Authorization: token, // Thay bằng token của bạn
          "Content-Type": "application/json",
          Retailer: "benthanhtsc",
        },
      }
    );

    // Lưu thông tin webhook vào database
    const webhook = await prisma.webhook.create({
      data: {
        type,
        url,
        isActive: true,
        description,
        secret: encodedSecret, // Lưu secret đã mã hóa
      },
    });

    // Lấy dữ liệu webhook vừa lưu
    const savedWebhook = await prisma.webhook.findUnique({
      where: {
        id: webhook.id,
      },
    });

    return res.status(201).json({
      message: "Webhook registered successfully",
      webhook: savedWebhook,
      kiotVietResponse: kiotResponse.data,
    });
  } catch (error) {
    console.error(
      "Lỗi khi đăng ký webhook:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Failed to register webhook",
      error: error.response?.data || error.message,
    });
  }
};
