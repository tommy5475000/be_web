import { PrismaClient } from "@prisma/client";
import axios from "axios";
import getAccessToken from "./auth.mjs";

const prisma = new PrismaClient();

export const getAllSupplier = async (accessToken) => {
  if (!accessToken) return null;

  let allSupplier = [];
  let pageSize = 100;
  let currentItem = 0; // Bắt đầu từ bản ghi đầu tiên
  let supplierSet = new Set(); // Lưu ID để tránh trùng lặp

  while (true) {
    try {
      const response = await axios.get("https://public.kiotapi.com/suppliers", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          pageSize,
          currentItem, // Sử dụng currentItem để phân trang
          orderBy: "id", // Ép API trả theo ID tăng dần
        },
      });

      const suppliers = response.data.data;
      if (!suppliers || suppliers.length === 0) break; // Hết dữ liệu thì dừng

      // Loại bỏ trùng lặp bằng Set
      suppliers.forEach((sup) => {
        if (!supplierSet.has(sup.id)) {
          supplierSet.add(sup.id);
          allSupplier.push(sup);
        } else {
          console.log(`⚠️ Trùng ID trong API (bỏ qua): ${sup.id}`);
        }
      });

      console.log(`📥 Đã lấy từ ${currentItem} đến ${currentItem + suppliers.length}`);

      currentItem += suppliers.length; // Cập nhật vị trí bắt đầu trang tiếp theo

      if (suppliers.length < pageSize) break; // Trang cuối cùng
    } catch (error) {
      console.log("❌ Lỗi API supplier:", error.message);
      break;
    }
  }

  console.log(`✅ Tổng số supplier lấy từ API: ${allSupplier.length}`);
  return allSupplier;
};

// const saveSupsToDatabase = async (data) => {
//   if (!data || data.length === 0) {
//     console.log("Không có nhà cung cấp để lưu");
//     return;
//   }

//   const batchSize = 50;
//   for (let i = 0; i < data.length; i += batchSize) {
//     const batch = data.slice(i, i + batchSize);

//     const savePromises = batch.map(async (supplier) => {
//       const { id, ...rest } = supplier;

//       try {
//         const checkSup = await prisma.suppliers.findUnique({
//             where:{
//                 id
//             }
//         })

//         let upsertedSup;
//         if (checkSup) {
//             upsertedSup = await prisma.suppliers.update({
//                 where:{
//                     id
//                 },
//                 data:{
//                     ...rest,
//                 }
//             })
//         } else{
//           upsertedSup = await prisma.suppliers.create({
//             data:{
//               id,
//               ...rest
//             }
//           })
//         }

//       } 
      
//       catch (error) {
//         console.error(`ID nhà cung cấp lỗi ${id}:`, 
//           error.messenge, 
//           error.stack)
//       }
//     });
//     await Promise.all(savePromises)
//   }
// };

const saveSupsToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.log("Không có nhà cung cấp để lưu");
    return;
  }

  const batchSize = 50;
  let skippedSuppliers = []; // 🔴 Danh sách supplier bị lỗi

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const savePromises = batch.map(async (supplier) => {
      const { id, ...rest } = supplier;

      try {
        await prisma.suppliers.upsert({
          where: { id },  // Nếu tồn tại thì update
          update: {id, ...rest },
          create: { id, ...rest }, // Nếu chưa có thì tạo mới
        });
      } catch (error) {
        skippedSuppliers.push(id);
        console.error(`❌ Lỗi lưu nhà cung cấp ${id}:`, error.message);
      }
    });

    await Promise.all(savePromises);
  }

  console.log(`✔️ Đã lưu thành công ${data.length - skippedSuppliers.length} nhà cung cấp`);
  console.log(`❌ Số supplier lỗi: ${skippedSuppliers.length}`);
};

const updateSups= async()=>{
  const accessToken = await getAccessToken();
  if (accessToken) {
    const sups=await getAllSupplier(accessToken)
    if (sups) {
      await saveSupsToDatabase(sups)
    }
  }
}

export {updateSups, saveSupsToDatabase} 