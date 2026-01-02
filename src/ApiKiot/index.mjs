import cron from "node-cron";
import axios from "axios";
import fs from "fs";
import { updateBills } from "./invoiceKiot.mjs";
import { updateReturnInvoice } from "./returnInvoice.mjs";
import { updateOneBill } from "./invoiceKiotGetIdOrCode.mjs";
import { updatePur } from "./purchaseorders.mjs";
import { updateTransfers } from "./transfers.mjs";
import { updateBranches } from "./branches.mjs";
import { upCategories } from "./categories.mjs";
import { updateProducts } from "./productKiot.mjs";
import { updateSups } from "./suppliersKiot.mjs";
import { updateUsers } from "./userKiot.mjs";
import getAccessToken from "./auth.mjs";

// 👉 file lưu mốc sync (tự tạo)
const SYNC_FILE = "./lastSync.json";

/* ======================
   HELPER TIME
====================== */
const nowISO = () => new Date().toISOString();

const getLastSync = () => {
  if (!fs.existsSync(SYNC_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(SYNC_FILE, "utf8")).lastSync || null;
  } catch {
    return null;
  }
};

const setLastSync = (iso) => {
  fs.writeFileSync(SYNC_FILE, JSON.stringify({ lastSync: iso }, null, 2));
};

const cronSyncBills = async () => {
  const from =
    getLastSync() ||
    new Date(Date.now() - 60 * 60 * 1000).toISOString(); // lần đầu lùi 1h

  const to = nowISO();

  console.log(`⏱️ Sync bills từ ${from} → ${to}`);

  try {
    // ✅ index chỉ gọi 1 hàm updateBills thôi
    await updateBills({ from, to });

    setLastSync(to);
    console.log(`✅ Done. lastSync saved: ${SYNC_FILE}`);
  } catch (err) {
    console.error("❌ Cron sync error:", err?.response?.data || err.message);
  }
};

console.log("🚀 Kiot invoice cron started");
console.log("🧾 lastSync file:", SYNC_FILE);

cron.schedule(
  "*/0.5 8-23 * * *",
  async () => {
    console.log("✅ [Cron] tick");
    await cronSyncBills();
  },
  { timezone: "Asia/Ho_Chi_Minh", runOnInit: true }
);

setInterval(() => {}, 1000 * 60 * 60);



// Gán ngày theo giờ VN tự động kéo sẽ kéo từ đầu
// let today = new Date().toLocaleDateString("en-CA", {
//   timeZone: "Asia/Ho_Chi_Minh",
// });
// console.log(`🚀 App started - Today is: ${today}`);

// // Cron từ 8h đến 23h mỗi phút
// cron.schedule(
//   "*/5 8-23 * * *",
//   () => {
//     console.log("✅ [Cron] Running updateBills...");
//     updateBills(today)
//       .then(() => {
//         console.log(`✅ Bills updated: ${today}`);
//       })
//       .catch((err) => {
//         console.error("❌ updateBills error:", err);
//       });
//   },
//   {
//     timezone: "Asia/Ho_Chi_Minh"
//   }
// );

// cron.schedule(
//   "0 0 * * *",
//   () => {
//     today = new Date().toLocaleDateString("en-CA", {
//       timeZone: "Asia/Ho_Chi_Minh",
//     });
//     console.log(`📅 Chuyển sang ngày mới: ${today}`);
//   },
//   {
//     timezone: "Asia/Ho_Chi_Minh"
//   }
// );

// // // Giữ tiến trình sống
// setInterval(() => {}, 1000 * 60 * 60);
//   updateBills(today).then(() => console.log("Get bill successfully."));
  
  
// // // Thiết lập cron job nếu cần
// cron.schedule("*/1 8-23 * * *", () => {
//   // Gói toàn bộ logic vào một hàm async
//   (async () => {
//     try {
//       await updateBills(today);
//       console.log("✅ Bills updated successfully.");
//     } catch (err) {
//       console.error("❌ Error while updating bills:", err);
//     }
//   })(); // <-- gọi hàm async tự chạy
// });

// today.setDate(today.getDate() - 1);


// Kéo tay
// Chạy cập nhật người dùng
// updateOneBill({code:"HD362592"}).then(()=>console.log("Đã get bill"));
// updateBills('2026-01-02').then(() => console.log("Bills updated successfully."));
// updateUsers().then(() => console.log("Users updated successfully."));
// updateProducts().then(()=> console.log("Danh mục hành hóa đã api thành công "));
// updateReturnInvoice().then(()=> console.log("Api bill trả hàng thành công"))
// updateSups().then(()=> console.log("Nhà cung cấp đã api thành công "))
// updateTransfers().then(()=>console.log("Đã lấy hết phiếu điều chuyển."));
// updateBranches().then(()=>console.log("Đã lấy hết chi nhánh"))
// updatePur().then(()=>console.log("Đã cập nhập phiếu nhập hàng"))
// upCategories().then(()=>console.log("Đã cập nhật nhóm ngành hàng"));
