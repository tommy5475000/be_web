import { PrismaClient } from "@prisma/client";
import axios from "axios";
import getAccessToken from "./auth.mjs";

const prisma = new PrismaClient();

export const getAllProducts = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  let allProducts = [];
  let currentItem = 0; // Bắt đầu từ item đầu tiên
  const pageSize = 100;
  let totalProducts = null;

  while (true) {
    try {
      console.log(`Fetching items starting from ${currentItem}...`);
      const response = await axios.get("https://public.kiotapi.com/products", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          currentItem,
          pageSize,
        },
      });

      const products = response.data.data;
      totalProducts = response.data.total || totalProducts;

      if (!products || products.length === 0) {
        break;
      }

      allProducts = allProducts.concat(products);
      console.log(
        `Fetched ${products.length} products starting from item ${currentItem}.`
      );

      // Nếu số lượng sản phẩm trả về nhỏ hơn pageSize hoặc đã đủ tổng sản phẩm, dừng vòng lặp
      if (
        products.length < pageSize ||
        (totalProducts && allProducts.length >= totalProducts)
      ) {
        console.log("All products fetched, stopping.");
        break;
      }

      // Cập nhật currentItem để lấy trang tiếp theo
      currentItem += pageSize;
    } catch (error) {
      console.error(
        "Error fetching products:",
        error.response?.data || error.message
      );
      break;
    }
  }

  console.log(`Total products fetched: ${allProducts.length}`);
  return allProducts;
};

const saveProductsToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("No products to save.");
    return;
  }

  const savePromises = data.map(async (product) => {
    const {
      createdDate,
      modifiedDate,
      id: kiotProductId,
      attributes,
      ...rest // Lấy tất cả các thuộc tính khác
    } = product;

    try {
      const formattedCreatedDate =
        createdDate && !isNaN(new Date(createdDate).getTime())
          ? new Date(createdDate).toISOString()
          : null;

      const formattedModifiedDate =
        modifiedDate && !isNaN(new Date(modifiedDate).getTime())
          ? new Date(modifiedDate).toISOString()
          : null;

      // Kiểm tra sản phẩm đã tồn tại chưa
      const existingProduct = await prisma.product.findUnique({
        where: { kiotProductId },
      });

      let upsertedProduct;
      if (existingProduct) {
        // Nếu sản phẩm đã tồn tại, cập nhật
        upsertedProduct = await prisma.product.update({
          where: { kiotProductId },
          data: {
            ...rest,
            modifiedDate: formattedModifiedDate,
          },
        });
      } else {
        // Nếu sản phẩm chưa tồn tại, tạo mới
        upsertedProduct = await prisma.product.create({
          data: {
            kiotProductId,
            ...rest,
            createdDate: formattedCreatedDate,
            modifiedDate: formattedModifiedDate,
          },
        });
      }

      // Lưu thuộc tính nếu có
      if (attributes && attributes.length > 0) {
        await Promise.all(
          attributes.map((attr) => {
            return prisma.attribute.upsert({
              where: {
                productId_attributeName: {
                  productId: upsertedProduct.id, // Sử dụng ID của sản phẩm đã được upsert
                  attributeName: attr.attributeName,
                },
              },
              update: {
                attributeValue: attr.attributeValue,
              },
              create: {
                productId: upsertedProduct.id, // Sử dụng ID của sản phẩm đã được upsert
                attributeName: attr.attributeName,
                attributeValue: attr.attributeValue,
              },
            });
          })
        );
      }
      console.log(`Product ${rest.name} saved or updated.`);
    } catch (error) {
      console.error(`Error saving product ${rest.name}:`, error);
    }
  });

  await Promise.all(savePromises);
};

// Thiết lập cron job để tự động cập nhật sản phẩm
const updateProducts = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const products = await getAllProducts(accessToken);
    if (products) {
      await saveProductsToDatabase(products);
    }
  }
};

export { updateProducts, saveProductsToDatabase };
