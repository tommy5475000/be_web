import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import getAccessToken from './auth.mjs';

const prisma = new PrismaClient();

export const getAllProducts = async (accessToken) => {
  if (!accessToken) return null;

  let allProducts = [];
  let currentItem = 0;
  const pageSize = 100;
  let totalProducts = null;

  while (true) {
    try {
      console.log(`Fetching items starting from ${currentItem}...`);
      const response = await axios.get('https://public.kiotapi.com/products', {
        headers: {
          Authorization: accessToken,
          Retailer: 'benthanhtsc',
        },
        params: {
          currentItem,
          pageSize,
          includeInventory: true,
        },
      });

      const products = response.data.data;
      totalProducts = response.data.total || totalProducts;

      if (!products || products.length === 0) break;

      allProducts = allProducts.concat(products);
      console.log(`Fetched ${products.length} products from ${currentItem}.`);

      if (
        products.length < pageSize ||
        (totalProducts && allProducts.length >= totalProducts)
      ) {
        console.log('All products fetched, stopping.');
        break;
      }

      currentItem += pageSize;
    } catch (error) {
      console.error(
        'Error fetching products:',
        error.response?.data || error.message,
      );
      break;
    }
  }

  console.log(`Total products fetched: ${allProducts.length}`);
  return allProducts;
};

// chạy theo batch để khỏi nổ Promise.all 23k
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export const saveProductsToDatabase = async (data) => {
  if (!data?.length) {
    console.error('No products to save.');
    return;
  }

  const BATCH_SIZE = 200; // 100-500 tùy máy/db
  const batches = chunk(data, BATCH_SIZE);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];

    // mỗi batch chạy song song vừa phải
    await Promise.all(
      batch.map(async (product) => {
        const {
          id: kiotProductId,
          images,
          attributes = [],
          productTaxs = [],
          inventories = [],
          purchaseTax,
          ...rest
        } = product;

        try {
          // 1) Upsert product
          const upsertedProduct = await prisma.productKiot.upsert({
            where: { kiotProductId },
            update: { ...rest },
            create: { kiotProductId, ...rest },
          });

          if (inventories.length) {
            await Promise.all(
              inventories.map((inv) =>
                prisma.inventoriesKiot.upsert({
                  where: {
                    kiotProductId_branchId: {
                      kiotProductId,
                      branchId: inv.branchId,
                    },
                  },
                  update: {
                    productCode: inv.productCode,
                    productName: inv.productName,
                    branchName: inv.branchName,
                    cost: inv.cost,
                    onHand: inv.onHand,
                    reserved: inv.reserved,
                    actualReserved: inv.actualReserved,
                    minQuantity: inv.minQuantity,
                    maxQuantity: inv.maxQuantity,
                    isActive: inv.isActive,
                    onOrder: inv.onOrder,
                  },
                  create: {
                    kiotProductId,
                    productCode: inv.productCode,
                    productName: inv.productName,
                    branchId: inv.branchId,
                    branchName: inv.branchName,
                    cost: inv.cost,
                    onHand: inv.onHand,
                    reserved: inv.reserved,
                    actualReserved: inv.actualReserved,
                    minQuantity: inv.minQuantity,
                    maxQuantity: inv.maxQuantity,
                    isActive: inv.isActive,
                    onOrder: inv.onOrder,
                  },
                }),
              ),
            );
          }

          // 2) Upsert product tax
          if (productTaxs.length) {
            await Promise.all(
              productTaxs.map((detail) =>
                prisma.productKiotTax.upsert({
                  where: {
                    kiotProductId_taxId: {
                      kiotProductId, // lấy từ product.id
                      taxId: detail.taxId,
                    },
                  },
                  update: {
                    name: detail.name,
                    value: detail.value,
                  },
                  create: {
                    kiotProductId,
                    taxId: detail.taxId,
                    name: detail.name,
                    value: detail.value,
                  },
                }),
              ),
            );
          }
          const purchaseTaxes = Array.isArray(purchaseTax)
            ? purchaseTax
            : purchaseTax
              ? [purchaseTax]
              : [];

          if (purchaseTaxes.length) {
            await Promise.all(
              purchaseTaxes.map((item) =>
                prisma.purchaseTax.upsert({
                  where: {
                    kiotProductId_taxId: {
                      kiotProductId,
                      taxId: item.taxId,
                    },
                  },
                  update: {
                    taxId: item.taxId,
                    value: item.value,
                    name: item.name,
                  },
                  create: {
                    kiotProductId,
                    taxId: item.taxId,
                    value: item.value,
                    name: item.name,
                  },
                }),
              ),
            );
          }

          // 3) Upsert attributes
          if (attributes.length) {
            await Promise.all(
              attributes.map((attr) =>
                prisma.attributes.upsert({
                  where: {
                    kiotProductId_attributeName: {
                      kiotProductId, // ✅ ĐÚNG
                      attributeName: attr.attributeName,
                    },
                  },
                  update: {
                    attributeValue: attr.attributeValue,
                  },
                  create: {
                    kiotProductId,
                    attributeName: attr.attributeName,
                    attributeValue: attr.attributeValue,
                  },
                }),
              ),
            );
          }

          console.log(`✅ Saved/Updated: ${rest.name}`);
        } catch (error) {
          console.error(`❌ Error saving product ${rest.name}:`, error);
        }
      }),
    );

    console.log(
      `Batch ${bi + 1}/${batches.length} done (${batch.length} items).`,
    );
  }
};

export const updateProducts = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  try {
    const products = await getAllProducts(accessToken);
    if (products?.length) {
      await saveProductsToDatabase(products);
    }
  } finally {
    // QUAN TRỌNG: cho process thoát + giải phóng connection
    await prisma.$disconnect();
  }
};
