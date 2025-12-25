import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import express from "express";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const SECRET = "bXlfc2VjcmV0X2tleV9kb19haV9iaWV0X2Rj"; // Secret từ KiotViet

// ✅ Hàm xác thực chữ ký webhook
const verifySignature = (req, secret) => {
  const signature = req.headers["x-hub-signature-256"] || req.headers["x-hub-signature"];
  if (!signature) return false;

  const computedHash = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex")}`;

  return signature === computedHash;
};

// ✅ Xử lý webhook từ KiotViet
export const billsApi = async (req, res) => {
  try {
    if (!verifySignature(req, SECRET)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Notifications } = req.body;
    if (!Notifications || Notifications.length === 0) {
      return res.status(400).json({ message: "Invalid data" });
    }
    
    for (const notification of Notifications) {
      console.log("Received Action:", notification.Action); // 📝 Ghi log Action
      if (notification.Action !== "invoice.update") continue; // Chỉ xử lý "invoice.update"

      for (const bill of notification.Data) {
        const {
          Id,
          Code,
          PurchaseDate,
          BranchId,
          BranchName,
          SoldById,
          SoldByName,
          CustomerId,
          CustomerCode,
          CustomerName,
          Total,
          TotalPayment,
          Discount,
          DiscountRatio,
          Status,
          StatusValue,
          Description,
          UsingCod,
          ModifiedDate,
          InvoiceDetails = [],  // Danh sách sản phẩm
          invoiceDetailTaxs=[],
          InvoiceDelivery = null, // Thông tin giao hàng
          Payments = [],        // Danh sách thanh toán
        } = bill;

        await prisma.invoice.upsert({
          where: { id: Id },
          update: {
            sohd: Code,
            purchaseDate: new Date(PurchaseDate),
            branchId: BranchId,
            branchName: BranchName,
            soldById: SoldById,
            soldByName: SoldByName,
            customerId: CustomerId || null,
            customerCode: CustomerCode || null,
            customerName: CustomerName || null,
            total: Total,
            totalPayment: TotalPayment,
            discount: Discount || null,
            discountRatio: DiscountRatio || null,
            status: Status,
            statusValue: StatusValue,
            description: Description || null,
            usingCod: UsingCod,
            modifiedDate: ModifiedDate ? new Date(ModifiedDate) : null,

            // ✅ Cập nhật danh sách sản phẩm
            invoiceDetails: {
              deleteMany: { invoiceId: Id }, // Xóa dữ liệu cũ
              create: InvoiceDetails.map(detail => ({
                productId: detail.ProductId,
                productCode: detail.ProductCode,
                productName: detail.ProductName,
                quantity: detail.Quantity,
                price: detail.Price,
                discount: detail.Discount || null,
                discountRatio: detail.DiscountRatio || null,
              })),
            },
            invoiceDetailTaxs:{

            },
            // // ✅ Cập nhật thông tin giao hàng nếu có
            // deliveryInfo: InvoiceDelivery
            //   ? {
            //       upsert: {
            //         update: {
            //           deliveryCode: InvoiceDelivery.DeliveryCode,
            //           status: InvoiceDelivery.Status,
            //           statusValue: InvoiceDelivery.StatusValue,
            //           type: InvoiceDelivery.Type || null,
            //           price: InvoiceDelivery.Price || null,
            //           receiver: InvoiceDelivery.Receiver,
            //           contactNumber: InvoiceDelivery.ContactNumber,
            //           address: InvoiceDelivery.Address,
            //           locationId: InvoiceDelivery.LocationId || null,
            //           locationName: InvoiceDelivery.LocationName || null,
            //           weight: InvoiceDelivery.Weight || null,
            //           length: InvoiceDelivery.Length || null,
            //           width: InvoiceDelivery.Width || null,
            //           height: InvoiceDelivery.Height || null,
            //           partnerDeliveryId: InvoiceDelivery.PartnerDeliveryId || null,
            //           partnerDelivery: InvoiceDelivery.PartnerDelivery
            //             ? {
            //                 upsert: {
            //                   update: {
            //                     code: InvoiceDelivery.PartnerDelivery.Code,
            //                     name: InvoiceDelivery.PartnerDelivery.Name,
            //                     contactNumber: InvoiceDelivery.PartnerDelivery.ContactNumber,
            //                     address: InvoiceDelivery.PartnerDelivery.Address,
            //                     email: InvoiceDelivery.PartnerDelivery.Email,
            //                   },
            //                   create: {
            //                     code: InvoiceDelivery.PartnerDelivery.Code,
            //                     name: InvoiceDelivery.PartnerDelivery.Name,
            //                     contactNumber: InvoiceDelivery.PartnerDelivery.ContactNumber,
            //                     address: InvoiceDelivery.PartnerDelivery.Address,
            //                     email: InvoiceDelivery.PartnerDelivery.Email,
            //                   },
            //                 },
            //               }
            //             : undefined,
            //         },
            //         create: {
            //           deliveryCode: InvoiceDelivery.DeliveryCode,
            //           status: InvoiceDelivery.Status,
            //           statusValue: InvoiceDelivery.StatusValue,
            //           type: InvoiceDelivery.Type || null,
            //           price: InvoiceDelivery.Price || null,
            //           receiver: InvoiceDelivery.Receiver,
            //           contactNumber: InvoiceDelivery.ContactNumber,
            //           address: InvoiceDelivery.Address,
            //           locationId: InvoiceDelivery.LocationId || null,
            //           locationName: InvoiceDelivery.LocationName || null,
            //           weight: InvoiceDelivery.Weight || null,
            //           length: InvoiceDelivery.Length || null,
            //           width: InvoiceDelivery.Width || null,
            //           height: InvoiceDelivery.Height || null,
            //           partnerDeliveryId: InvoiceDelivery.PartnerDeliveryId || null,
            //         },
            //       },
            //     }
            //   : undefined,

            // ✅ Cập nhật danh sách thanh toán nếu có
            payments: {
              deleteMany: { id_pay: Id }, // Xóa dữ liệu cũ
              create: Payments.map(payment => ({
                id_pay: payment.Id,
                code: payment.Code,
                amount: payment.Amount,
                accountId: payment.AccountId || null,
                bankAccount: payment.BankAccount || null,
                description: payment.Description || null,
                method: payment.Method,
                status: payment.Status || null,
                statusValue: payment.StatusValue || null,
                transDate: new Date(payment.TransDate),
              })),
            },
          },
          create: {
            id: Id,
            sohd: Code,
            purchaseDate: new Date(PurchaseDate),
            branchId: BranchId,
            branchName: BranchName,
            soldById: SoldById,
            soldByName: SoldByName,
            customerId: CustomerId || null,
            customerCode: CustomerCode || null,
            customerName: CustomerName || null,
            total: Total,
            totalPayment: TotalPayment,
            discount: Discount || null,
            discountRatio: DiscountRatio || null,
            status: Status,
            statusValue: StatusValue,
            description: Description || null,
            usingCod: UsingCod,
            modifiedDate: ModifiedDate ? new Date(ModifiedDate) : null,
          },
        });
      }
    }

    return res.status(200).json({ message: "Invoice data updated successfully" });
  } catch (error) {
    console.error("Lỗi xử lý webhook:", error.message);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
