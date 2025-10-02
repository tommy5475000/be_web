import { PrismaClient } from "@prisma/client";
import getAccessToken from "./auth.mjs";
import axios from "axios";

const prisma = new PrismaClient();
export const getAllBranches = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  let allBranches = [];
  let currentItem = 0;
  const pageSize = 100;
  let totalBranchs = null;

  while (true) {
    try {
      const response = await axios.get("https://public.kiotapi.com/branches", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          currentItem,
          pageSize,
        },
      });

      const branchs = response.data.data;
      totalBranchs = response.data.data || totalBranchs;

      if (!branchs || branchs.length === 0) {
        break;
      }

      allBranches = allBranches.concat(branchs);

      if (
        branchs.length < pageSize ||
        (totalBranchs && allBranches.length >= totalBranchs)
      ) {
        break;
      }
      currentItem += currentItem;
    } catch (error) {
      console.error("Lỗi không lấy được dữ liệu:", error.message);
      break;
    }
  }
  console.log(`Tổng số chi nhánh api:${allBranches.length}`);
  return allBranches;
};

const saveAllBranchesToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("Không có dữ liệu để lấy về");
    return;
  }

  const batchSize = 5;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const savePromises = batch.map(async (branch) => {
      const { id, ...rest } = branch;

      try {
        const checkBranch = await prisma.branches.findUnique({
          where: { id },
        });

        let upsertedBranch;

        if (checkBranch) {
          upsertedBranch = await prisma.branches.update({
            where: { id },
            data: {
              ...rest,
            },
          });
        } else {
          upsertedBranch = await prisma.branches.create({
            data: {
              id,
              ...rest,
            },
          });
        }
      } catch (error) {}
    });
  }
};

const updateBranches = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const branch = await getAllBranches(accessToken);

    if (branch) {
      await saveAllBranchesToDatabase(branch);
    }
  }
};

export { updateBranches, saveAllBranchesToDatabase };
