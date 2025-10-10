import axios from "axios";
import getAccessToken from "./auth.mjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllCategories = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  let allCategoris = [];
  let currentItem = 0;
  const pageSize = 100;
  let totalCategoris = null;

  while (true) {
    try {
      const response = await axios.get(
        "https://public.kiotapi.com/categories",
        {
          headers: {
            Authorization: accessToken,
            Retailer: "benthanhtsc",
          },
          params: {
            currentItem,
            pageSize,
            hierachicalData: true,
          },
        }
      );

      const categories = response.data.data;
      totalCategoris = response.data.data || totalCategoris;

      if (!categories || categories.length === 0) {
        break;
      }

      allCategoris = allCategoris.concat(categories);

      if (
        categories.length < pageSize ||
        (totalCategoris && allCategoris.length >= totalCategoris)
      ) {
        break;
      }
      currentItem += pageSize;
    } catch (error) {
      console.error("Lỗi không lấy được dữ liệu", error.message);
      break;
    }
  }
  console.log(`Tổng số nhóm ngành hàng api:${allCategoris.length}`);
  return allCategoris;
};

const saveCategoriesToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("Không có dữ liệu để lấy về");
    return;
  }

  const batchSize = 10;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const savePromises = batch.map(async (category) => {
      const {
        categoryId,
        children: childrenL2CategoryKiot,
        ...rest
      } = category;

      try {
        const checkCategory = await prisma.categoryKiot.findUnique({
          where: { categoryId },
        });

        let upsertedCategory;

        if (checkCategory) {
          upsertedCategory = await prisma.categoryKiot.update({
            where: {
              categoryId,
            },
            data: {
              ...rest,
            },
          });
        } else {
          upsertedCategory = await prisma.categoryKiot.create({
            data: {
              categoryId,
              ...rest,
            },
          });
        }

        if (upsertedCategory.hasChild) {
          await Promise.all(
            childrenL2CategoryKiot.map(async (detail) => {
              const saveDetail = await prisma.childrenL2CategoryKiot.upsert({
                where: {
                  parentId_categoryName: {
                    parentId: upsertedCategory.categoryId,
                    categoryName: detail.categoryName,
                  },
                },
                update: {
                  categoryId: detail.categoryId,
                  categoryName: detail.categoryName,
                  retailerId: detail.retailerId,
                  hasChild: detail.hasChild,
                  modifiedDate: detail.modifiedDate,
                },
                create: {
                  parentId: upsertedCategory.categoryId,
                  categoryId: detail.categoryId,
                  categoryName: detail.categoryName,
                  retailerId: detail.retailerId,
                  hasChild: detail.hasChild,
                  createdDate: detail.createdDate,
                },
              });

              if (detail.children?.length ) {
                await Promise.all(
                  detail.children.map((item) =>
                    prisma.childrenL3CategoryKiot.upsert({
                      where: {
                        parentId_categoryName: {
                          parentId: saveDetail.categoryId,
                          categoryName: item.categoryName,
                        },
                      },
                      update: {
                        categoryName: item.categoryName,
                        retailerId: item.retailerId,
                        hasChild: item.hasChild,
                        modifiedDate: item.modifiedDate,
                      },
                      create: {
                        parentId: saveDetail.categoryId,
                        categoryId: item.categoryId,
                        categoryName: item.categoryName,
                        retailerId: item.retailerId,
                        hasChild: item.hasChild,
                        createdDate: item.createdDate,
                      },
                    })
                  )
                );
              }
            })
          );
        }

        console.log(`Nhóm ngành hàng ${categoryId} đã lưu và cập nhật`);
        console.log(`Tổng nhóm ngành hàng ${data.length} đã lưu và cập nhật`);
      } catch (error) {
        console.error(
          `Lỗi lưu nhóm ngành hàng ${categoryId}:`,
          error.message,
          error.stack
        );
      }
    });
    await Promise.all(savePromises);
  }
};

const upCategories = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const category = await getAllCategories(accessToken);
    if (category) {
      await saveCategoriesToDatabase(category);
    }
  }
};

export { saveCategoriesToDatabase, upCategories };
