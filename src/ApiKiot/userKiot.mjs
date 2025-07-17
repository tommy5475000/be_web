import { PrismaClient } from "@prisma/client";
import axios from "axios";
import getAccessToken from "./auth.mjs";

const prisma = new PrismaClient();

export const getAllUsers = async (accessToken) => {
  if (!accessToken) {
    return null;
  }

  let allUsers = [];
  let currentItem = 0;
  const pageSize = 20;
  let totalUsers = null;

  while (true) {
    try {
      const response = await axios.get("https://public.kiotapi.com/users", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          currentItem,
          pageSize,
        },
      });

      const users = response.data.data;
      totalUsers = response.data.total || totalUsers;

      if (!users || users.length === 0) {
        break;
      }

      allUsers = allUsers.concat(users);

      if (
        users.length < pageSize ||
        (totalUsers && allUsers.length >= totalUsers)
      ) {
        break;
      }

      currentItem += pageSize;
    } catch (error) {
      break;
    }
  }
  return allUsers;
};

const saveUsersToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("No users to save");
    return;
  }

  const savePromises = data.map(async (user) => {
    const {
          id: kiotUserId,
      ...rest
    } = user;

    try {
      const existingUser = await prisma.taiKhoan.findUnique({
        where: {
          kiotUserId,
        },
      });

      let upsertedUser;
      if (existingUser) {
        upsertedUser = await prisma.taiKhoan.update({
          where: { kiotUserId },
          data: {
            ...rest,
            trangThai: "0",
          },
        });
      } else {
        upsertedUser = await prisma.taiKhoan.create({
          data: {
            kiotUserId,
            ...rest,
            trangThai: "0",
          },
        });
      }
    } catch (error) {
      console.error(`Error saving user ${rest.name}:`, error);
    }
  });

  await Promise.all(savePromises);
};

const updateUsers = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const users = await getAllUsers(accessToken);
    if (users) {
      await saveUsersToDatabase(users);
    }
  }
};

export {updateUsers,saveUsersToDatabase};