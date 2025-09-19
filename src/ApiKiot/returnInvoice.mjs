import axios from "axios";
import getAccessToken from "./auth.mjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllReturnInvoice = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  let allReturnInvoice = [];
  let currentItem = 0;
  const pageSize = 100;
  let totalReturnInvoice = null;

  while (true) {
    try {
      const response = await axios.get("https://public.kiotapi.com/returns", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          currentItem,
          pageSize,
          // orderBy: "code",
          // createdDate,
        },
      });

      const returnInvoice = response.data.data;
      totalReturnInvoice = response.data.data || totalReturnInvoice;

      if (!returnInvoice || returnInvoice.length === 0) {
        break;
      }

      allReturnInvoice = allReturnInvoice.concat(returnInvoice);

      if (
        returnInvoice.length < pageSize ||
        (totalReturnInvoice && allReturnInvoice.length >= totalReturnInvoice)
      ) {
        break;
      }

      currentItem += pageSize;
    } catch (error) {
      console.error("Lỗi không thể lấy được bill trả hàng", error.message);
      break;
    }
  }
  console.log(`Tổng số bill trả hàng api: ${allReturnInvoice.length}`);
  return allReturnInvoice;
};

const saveReturnInvoiceToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("Không có bill trả hàng");
    return;
  }

  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const savePromises = batch.map(async (item) => {
      const { returnDetails, code, invoiceId, ...rest } = item;

      try {
        const checkReturn = await prisma.returnInvoice.findUnique({
          where: { code },
        });

        let upsertedReturn;
        if (checkReturn) {
          upsertedReturn = await prisma.returnInvoice.update({
            where: { code },
            data: {
              ...rest,
              ...(invoiceId && {
                Invoice: {
                  connect: { id: invoiceId },
                },
              }),
            },
          });
        } else {
          upsertedReturn = await prisma.returnInvoice.create({
            data: {
              code,
              ...rest,
              ...(invoiceId && {
                Invoice: {
                  connect: { id: invoiceId },
                },
              }),
            },
          });
        }

        await Promise.all(
          returnDetails.map(async (detail) => {
            const savedDetail = await prisma.returnDetails.upsert({
              where: {
                code_productId: {
                  code: upsertedReturn.code,
                  productId: detail.productId,
                },
              },
              update: {
                productId: detail.productId,
                productCode: detail.productCode,
                productName: detail.productName,
                quantity: detail.quantity,
                price: detail.price,
                usePoint: detail.usePoint,
                subTotal: detail.subTotal,
                note: detail.note,
              },
              create: {
                productId: detail.productId,
                productCode: detail.productCode,
                productName: detail.productName,
                quantity: detail.quantity,
                price: detail.price,
                usePoint: detail.usePoint,
                subTotal: detail.subTotal,
                note: detail.note,
                returnInvoice: {
                  connect: { code: upsertedReturn.code }, // 🔑 kết nối tới returnInvoice đã tồn tại
                },
              },
            });
          })
        );
         console.log(`Invoice ${code} saved or updated.`);
        console.log(`Total Invoice ${data.length} saved or updated.`);
      } catch (error) {
        console.error(
          `Error saving return invoice ${code}:`,
          error.message,
          error.stack
        );
      }
    });
    await Promise.all(savePromises);
  }
};

const updateReturnInvoice = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const returnInvoice = await getAllReturnInvoice(accessToken);
    if (returnInvoice) {
      await saveReturnInvoiceToDatabase(returnInvoice);
    }
  }
};

export { updateReturnInvoice, saveReturnInvoiceToDatabase };
