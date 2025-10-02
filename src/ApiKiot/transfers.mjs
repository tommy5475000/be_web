import { PrismaClient } from "@prisma/client";
import getAccessToken from "./auth.mjs";
import axios from "axios";

const prisma = new PrismaClient();

export const getAllTransfers = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  let allTrans = [];
  let currentItem = 0;
  const pageSize = 100;
  let totalTrans = null;

  while (true) {
    try {
      const response = await axios.get("https://public.kiotapi.com/transfers", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          currentItem,
          pageSize,
        },
      });

      const trans = response.data.data;
      totalTrans = response.data.data || totalTrans;

      if (!trans || trans.length === 0) {
        break;
      }
      allTrans = allTrans.concat(trans);

      if (
        trans.length < pageSize ||
        (totalTrans && allTrans.length >= totalTrans)
      ) {
        break;
      }
      currentItem += pageSize;
    } catch (error) {
      console.error("Error fetching transfers:", error.message);
      break;
    }
  }
  console.log(`Tổng số bill chuyển hàng: ${allTrans.length}`);
  return allTrans;
};

const saveTransfersToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("Không có bill chuyển hàng");
    return;
  }

  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const savePromises = batch.map(async (tran) => {
      const { code, transferDetails, ...rest } = tran;

      try {
        const checkTran = await prisma.transfers.findUnique({
          where: { code },
        });

        let upsertedTran;

        if (checkTran) {
          upsertedTran = await prisma.transfers.update({
            where: { code },
            data: {
              ...rest,
            },
          });
        } else {
          upsertedTran = await prisma.transfers.create({
            data: {
              code,
              ...rest,
            },
          });
        }

        await Promise.all(
          transferDetails.map(async (detail) => {
            const saveDetail = await prisma.transfersDetails.upsert({
              where: {
                code_productCode: {
                  code: upsertedTran.code,
                  productCode: detail.productCode,
                },
              },
              update: {
                productId: detail.productId,
                productCode: detail.productCode,
                productName: detail.productName,
                sendQuantity: detail.sendQuantity,
                receiveQuantity: detail.receiveQuantity,
                sendPrice: detail.sendPrice,
                receivePrice: detail.receivePrice,
                price: detail.price,
                transferId: detail.transferId,
              },
              create: {
                code: upsertedTran.code,
                productId: detail.productId,
                productCode: detail.productCode,
                productName: detail.productName,
                sendQuantity: detail.sendQuantity,
                receiveQuantity: detail.receiveQuantity,
                sendPrice: detail.sendPrice,
                receivePrice: detail.receivePrice,
                price: detail.price,
                transferId: detail.transferId,
              },
            });
          })
        );
        console.log(`Chuyển hàng ${code} đã lưu hoặc cập nhật`);
        console.log(
          `Tổng số phiếu chuyển  ${data.length} đã lưu hoặc cập nhật`
        );
      } catch (error) {
        console.error(
          `Lỗi lưu phiếu chuyển ${code}:`,
          error.message,
          error.stack
        );
      }
    });

    await Promise.all(savePromises);
  }
};

const updateTransfers = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const trans = await getAllTransfers(accessToken);
    if (trans) {
      await saveTransfersToDatabase(trans);
    }
  }
};

export { saveTransfersToDatabase, updateTransfers };
