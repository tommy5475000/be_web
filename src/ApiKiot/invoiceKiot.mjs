import { PrismaClient } from "@prisma/client";
import axios from "axios";
import getAccessToken from "./auth.mjs";

const prisma = new PrismaClient();

export const getAllInvoices = async (accessToken,createdDate) => {
  if (!accessToken) {
    return null;
  }

  let allBills = [];
  let currentItem = 0;
  const pageSize = 100;
  let totalBills = null;

  while (true) {
    try {
      const response = await axios.get("https://public.kiotapi.com/invoices", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          currentItem,
          pageSize,
          includePayment: true,
          orderBy:"code",
          createdDate
        },
      });

      const bills = response.data.data;
      totalBills = response.data.total || totalBills;

      if (!bills || bills.length === 0) {
        break;
      }

      allBills = allBills.concat(bills);

      if (
        bills.length < pageSize ||
        (totalBills && allBills.length >= totalBills)
      ) {
        break;
      }

      currentItem += pageSize;
    } catch (error) {
      console.error("Error fetching invoices:", error.message);
      break;
    }
  }
  console.log(`Tổng số bill api: ${allBills.length} `);
  return allBills;
};

const saveBillsToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("No invoices to save");
    return;
  }

  const batchSize = 100; // Xử lý mỗi lần 50 hóa đơn
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const savePromises = batch.map(async (bill) => {
      const {
        code: sohd,
        invoiceDetails,
        payments:payBills,
        ...rest
      } = bill;

      try {

        const checkBill = await prisma.invoice.findUnique({
          where: { sohd },
        });

        let upsertedBill;
        if (checkBill) {
          upsertedBill = await prisma.invoice.update({
            where: { sohd },
            data: {
              ...rest,
              // modifiedDate: formattedModifiedDate,
            },
          });
        } else {
          upsertedBill = await prisma.invoice.create({
            data: {
              sohd,
              ...rest,
            },
          });
        }

        // Lưu chi tiết hóa đơn nếu có
        await Promise.all(
          invoiceDetails.map(async (detail) => {
            return prisma.invoiceDetails.upsert({
              where: {
                invoiceId_productCode: {
                  invoiceId: upsertedBill.sohd,
                  productCode: detail.productCode,
                },
              },
              update: {
                productId: detail.productId,
                productCode: detail.productCode,
                productName: detail.productName,
                quantity: detail.quantity,
                price: detail.price,
                discount: detail.discount,
                categoryId: detail.categoryId,
                categoryName: detail.categoryName,
                tradeMarkId: detail.tradeMarkId,
                tradeMarkName: detail.tradeMarkName,
                subTotal: detail.subTotal,
                returnQuantity: detail.returnQuantity,
                discountRatio: detail.discountRatio,
                usePoint: detail.usePoint,
              },
              create: {
                invoiceId: upsertedBill.sohd,
                productId: detail.productId,
                productCode: detail.productCode,
                productName: detail.productName,
                quantity: detail.quantity,
                price: detail.price,
                discount: detail.discount,
                categoryId: detail.categoryId,
                categoryName: detail.categoryName,
                tradeMarkId: detail.tradeMarkId,
                tradeMarkName: detail.tradeMarkName,
                subTotal: detail.subTotal,
                returnQuantity: detail.returnQuantity,
                discountRatio: detail.discountRatio,
                usePoint: detail.usePoint,
              },
            });
          })
        );

        // Lưu chi tiết thanh toán hóa đơn nếu có
      
          await Promise.all(
            payBills.map((detail) => {
              return prisma.payBills.upsert({
                where: {
                  invoiceId_code: {
                    invoiceId: upsertedBill.sohd,
                    code: detail.code,
                  },
                },
                update: {
                  amount: detail.amount,
                  method: detail.method,
                  accountId: detail.accountId,
                  bankAccount: detail.bankAccount,
                  status: detail.status,
                  description: detail.description,
                  statusValue: detail.statusValue,
                  transDate: detail.transDate,
                },
                create: {
                  invoiceId: upsertedBill.sohd,
                  id_pay: detail.id,
                  code: detail.code,
                  amount: detail.amount,
                  method: detail.method,
                  accountId: detail.accountId,
                  bankAccount: detail.bankAccount,
                  status: detail.status,
                  statusValue: detail.statusValue,
                  description: detail.description,
                  transDate: detail.transDate,
                },
              });
            })
          );

        console.log(`Invoice ${sohd} saved or updated.`);
        console.log(`Total Invoice ${data.length} saved or updated.`);
      } catch (error) {
        console.error(
          `Error saving invoice ${sohd}:`,
          error.message,
          error.stack
        );
      }
    });
    await Promise.all(savePromises);
  }
};

const updateBills = async (createdDate) => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const bills = await getAllInvoices(accessToken,createdDate);
    if (bills) {
      await saveBillsToDatabase(bills);
    }
  }
};

export { updateBills, saveBillsToDatabase };
