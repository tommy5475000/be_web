import { PrismaClient } from "@prisma/client";
import axios from "axios";
import getAccessToken from "./auth.mjs";

const prisma = new PrismaClient();

export const getAllPurchaseorders = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  let allPurOrders = [];
  let currentItem = 0;
  let totalPurOrders = null;
  const pageSize = 100;

  while (true) {
    try {
      const response = await axios.get(
        "https://public.kiotapi.com/purchaseorders",
        {
          headers: {
            Authorization: accessToken,
            Retailer: "benthanhtsc",
          },
          params: {
            currentItem,
            pageSize,
            includePayment: true,
          },
        }
      );

      const purchase = response.data.data;
      totalPurOrders = response.data.total || totalPurOrders;

      if (!purchase || purchase.length === 0) {
        break;
      }

      allPurOrders = allPurOrders.concat(purchase);

      if (
        purchase.length < pageSize ||
        (totalPurOrders && allPurOrders.length >= totalPurOrders)
      ) {
        console.log("Đang tải xuống");
        break;
      }
      currentItem += pageSize;
    } catch (error) {
      console.log("Lỗi", error.response.data || error.message);
      break;
    }
  }
  console.log(`Tổng số phiếu nhập api: ${allPurOrders.length}`);
  return allPurOrders;
};

const savePurOrdersToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.log("Không có dữ liệu");
    return;
  }
  const savePromises = data.map(async (purchase) => {
    const {
      code: sopn,
      purchaseOrderDetails: purOrderDetails,
      purchaseOrderDetailTaxes,
      payments: purOrderPayments,
      ...rest
    } = purchase;

    try {
      const checkPurchase = await prisma.purchaseOrders.findUnique({
        where: {
          sopn,
        },
      });

      let upsertedPur;
      if (checkPurchase) {
        upsertedPur = await prisma.purchaseOrders.update({
          where: {
            sopn,
          },
          data: {
            ...rest,
          },
        });
      } else {
        upsertedPur = await prisma.purchaseOrders.create({
          data: {
            sopn,
            ...rest,
          },
        });
      }

      // Lưu chi tiết phiếu nhập
      if (Array.isArray(purOrderDetails) && purOrderDetails.length > 0) {
        await Promise.all(
          purOrderDetails.map(async (detail) => {
            return prisma.purchaseOrderDetails.upsert({
              where: {
                purCode_productCode: {
                  purCode: upsertedPur.sopn,
                  productCode: detail.productCode,
                },
              },
              update: {
                productId: detail.productId,
                masterUnitId: detail.masterUnitId,
                productCode: detail.productCode,
                productName: detail.productName,
                quantity: detail.quantity,
                price: detail.price,
                discount: detail.discount,
                discountRatio: detail.discountRatio,
              },
              create: {
                purCode: upsertedPur.sopn,
                productId: detail.productId,
                masterUnitId: detail.masterUnitId,
                productCode: detail.productCode,
                productName: detail.productName,
                quantity: detail.quantity,
                price: detail.price,
                discount: detail.discount,
                discountRatio: detail.discountRatio,
              },
            });
          })
        );
      }

      if (Array.isArray(purOrderPayments) && purOrderPayments.length > 0) {
      await Promise.all(
        purOrderPayments.map(async (detail) => {
          return prisma.payments.upsert({
            where: {
              purCode_code: {
                purCode: upsertedPur.sopn,
                code: detail.code,
              },
            },
            update: {
              amount: detail.amount,
              method: detail.method,
              status: detail.status,
              statusValue: detail.statusValue,
              transDate: detail.transDate,
            },
            create: {
              purCode: upsertedPur.sopn,
              code: detail.code,
              amount: detail.amount,
              method: detail.method,
              status: detail.status,
              statusValue: detail.statusValue,
              transDate: detail.transDate,
            },
          });
        })
      );
    }
      console.log(`Số phiếu nhập ${sopn} đã được lưu hoặc update`);
    } catch (error) {
      console.error(`Lỗi không lưu được ${sopn}:`, error.message, error.stack);
    }
  });
  await Promise.all(savePromises);
};

const updatePur = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const purchase = await getAllPurchaseorders(accessToken);
    if (purchase) {
      await savePurOrdersToDatabase(purchase);
    }
  }
};

export { updatePur, savePurOrdersToDatabase };
