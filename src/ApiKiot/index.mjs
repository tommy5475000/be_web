import { updateBills } from "./invoiceKiot.mjs";
import cron from "node-cron";

// Gán ngày theo giờ VN
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

// import { updateProducts } from "./productKiot.mjs";
// import { updatePur } from "./purchaseOrrders.mjs";
// import { updateSups } from "./suppliersKiot.mjs";
// import { updateUsers } from "./userKiot.mjs";
// today.setDate(today.getDate() - 1);
updateBills().then(() => console.log("Bills updated successfully."));
// Chạy cập nhật người dùng
// updateUser-().then(() => console.log("Users updated successfully."));
// updatePur().then(()=>console.log("Phiếu nhập đã api thành công"));
// updateSups().then(()=> console.log("Nhà cung cấp đã api thành công "))
// updateProducts().then(()=> console.log("Danh mục hành hóa đã api thành công "))
