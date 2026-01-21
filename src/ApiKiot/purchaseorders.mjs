import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import getAccessToken from './auth.mjs';

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
        'https://public.kiotapi.com/purchaseorders',
        {
          headers: {
            Authorization: accessToken,
            Retailer: 'benthanhtsc',
          },
          params: {
            currentItem,
            pageSize,
            includePayment: true,
          },
        },
      );

      const purchase = response.data.data;
      totalPurOrders = response.data.total || totalPurOrders;

      if (!purchase || purchase.length === 0) break;

      allPurOrders = allPurOrders.concat(purchase);
      console.log(`Fetched ${purchase.length} products from ${currentItem}.`);

      if (
        purchase.length < pageSize ||
        (totalPurOrders && allPurOrders.length >= totalPurOrders)
      ) {
        console.log('Đang tải xuống');
        break;
      }

      currentItem += pageSize;
    } catch (error) {
      console.log('Lỗi', error.response.data || error.message);
      break;
    }
  }
  console.log(`Tổng số phiếu nhập api: ${allPurOrders.length}`);
  return allPurOrders;
};

// chạy theo batch để khỏi nổ Promise.all 23k
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const savePurOrdersToDatabase = async (data) => {
  if (!data?.length) {
    console.log('Không có dữ liệu');
    return;
  }

  const BATCH_SIZE = 200;
  const batches = chunk(data, BATCH_SIZE);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];

    await Promise.all(
      batch.map(async (purchase) => {
        const {
          code,
          purchaseOrderDetails = [],
          purchaseOrderDetailTaxes = [],
          payments = [],
          ...rest
        } = purchase;

        try {
          const upsertedPur = await prisma.purcharse.upsert({
            where: { code },
            update: { ...rest },
            create: { code, ...rest },
          });

          if (purchaseOrderDetails?.length) {
            for (let i = 0; i < purchaseOrderDetails.length; i++) {
              const detail = purchaseOrderDetails[i];
              const lineNo = i + 1;

              await prisma.purchaseOrderDetails.upsert({
                where: {
                  code_lineNo: { code, lineNo },
                },
                update: {
                  masterUnitId: detail.masterUnitId,
                  productId: detail.productId,
                  productCode: detail.productCode,
                  productName: detail.productName,
                  quantity: detail.quantity,
                  price: detail.price,
                  discount: detail.discount,
                  discountRatio: detail.discountRatio,
                },
                create: {
                  code,
                  lineNo,
                  masterUnitId: detail.masterUnitId,
                  productId: detail.productId,
                  productCode: detail.productCode,
                  productName: detail.productName,
                  quantity: detail.quantity,
                  price: detail.price,
                  discount: detail.discount,
                  discountRatio: detail.discountRatio,
                },
              });

              const taxes = Array.isArray(detail.purchaseOrderDetailTaxes)
                ? detail.purchaseOrderDetailTaxes
                : [];
              if (!taxes.length) {
                continue; // sang detail tiếp theo
              }

              // ✅ Có tax → lưu
              for (const tax of taxes) {
                await prisma.purchaseOrderDetailTaxes.upsert({
                  where: {
                    code_lineNo_taxId: {
                      code,
                      lineNo,
                      taxId: tax.taxId,
                    },
                  },
                  update: {
                    retailerId: tax.retailerId ?? 0,
                    detailTax: tax.detailTax ?? 0,
                    taxName: tax.taxName ?? null,
                    taxValue: tax.taxValue ?? null,
                  },
                  create: {
                    code,
                    lineNo,
                    taxId: tax.taxId,
                    retailerId: tax.retailerId ?? 0,
                    detailTax: tax.detailTax ?? 0,
                    taxName: tax.taxName ?? null,
                    taxValue: tax.taxValue ?? null,
                  },
                });
              }
            }
          }

          if (payments.length) {
            await Promise.all(
              payments.map(async (detail) => {
                return prisma.payments.upsert({
                  where: {
                    id_code: {
                      code,
                      id: detail.id,
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
                    id: detail.id,
                    code,
                    amount: detail.amount,
                    method: detail.method,
                    status: detail.status,
                    statusValue: detail.statusValue,
                    transDate: detail.transDate,
                  },
                });
              }),
            );
          }

          console.log(`Số phiếu nhập ${code} đã được lưu hoặc update`);
        } catch (error) {
          console.error(
            `Lỗi không lưu được ${code}:`,
            error.message,
            error.stack,
          );
        }
      }),
    );
    console.log(
      `Batch ${bi + 1}/${batches.length} done (${batch.length} items).`,
    );
  }
};
// const savePromises = data.map(async (purchase) => {
//   const {
//     code: sopn,
//     purchaseOrderDetails: purOrderDetails,
//     purchaseOrderDetailTaxes,
//     payments: purOrderPayments,
//     ...rest
//   } = purchase;

//   });
//   await Promise.all(savePromises);
// };

export const updatePur = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  try {
    const purchase = await getAllPurchaseorders(accessToken);
    if (purchase?.length) {
      await savePurOrdersToDatabase(purchase);
    }
  } finally {
    await prisma.$disconnect();
  }
};
