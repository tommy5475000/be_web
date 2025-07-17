import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { registerWebhook } from "./webhook.mjs";
import { customerApi } from "./customer.mjs";
import { billsApi } from "./bills.mjs";

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());

// Route đăng ký webhook
app.post("/register-webhook", registerWebhook);
app.post("/webhook/customer.update", customerApi);
app.post("/webhook/invoice.update",billsApi);
// Start server
const PORT = process.env.PORT || 12368;
app.listen(PORT, () => {
  console.log(`Server is running on http://10.1.49.29:${PORT}`);
});
