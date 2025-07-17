import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import express from "express";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Hàm xác thực chữ ký từ KiotViet
export const verifySignature = (req, secret) => {
    const signature = req.headers["x-hub-signature-256"] || req.headers["x-hub-signature"];
    if (!signature) {
        console.log("❌ Không tìm thấy chữ ký trong headers!");
        return false;
    }
    const computedHash = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex")}`;


    return signature === computedHash;
  };

// Xử lý webhook từ KiotViet (customer.update)
export const customerApi = async (req, res) => {
    try {
    const secret = Buffer.from("bXlfc2VjcmV0X2tleQ==", "base64").toString("utf-8"); // Secret đã đăng ký với KiotViet
      if (!verifySignature(req, secret)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const { Notifications } = req.body;
      if (!Notifications || Notifications.length === 0) {
        return res.status(400).json({ message: "Invalid data" });
      }
  
      for (const notification of Notifications) {
        const { Action, Data } = notification;
    // In ra dữ liệu của khách hàng
    console.log("Received Data:", JSON.stringify(Data, null, 2));
        for (const customer of Data) {
          const {
            Id,
            Code,
            Name,
            Gender,
            BirthDate,
            ContactNumber,
            Address,
            LocationName,
            Email,
            ModifiedDate,
            Type,
            Organization,
            TaxCode,
            Comments,
          } = customer;
  
          await prisma.customer.upsert({
            where: { id: Id },
            update: {
              code: Code,
              name: Name,
              gender: Gender,
              birthDate: BirthDate ? new Date(BirthDate) : null,
              contactNumber: ContactNumber,
              address: Address,
              locationName: LocationName,
              email: Email,
              modifiedDate: new Date(ModifiedDate),
              type: Type,
              organization: Organization,
              taxCode: TaxCode,
              comments: Comments,
            },
            create: {
              id: Id,
              code: Code,
              name: Name,
              gender: Gender,
              birthDate: BirthDate ? new Date(BirthDate) : null,
              contactNumber: ContactNumber,
              address: Address,
              locationName: LocationName,
              email: Email,
              modifiedDate: new Date(ModifiedDate),
              type: Type,
              organization: Organization,
              taxCode: TaxCode,
              comments: Comments,
            },
          });
        }
      }
  
      return res.status(200).json({ message: "Customer data updated successfully" });
    } catch (error) {
      console.error("Lỗi xử lý webhook:", error.message);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
