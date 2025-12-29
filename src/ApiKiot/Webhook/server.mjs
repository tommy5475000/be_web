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

app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

app.post(/.*/, (req, res) => {
  console.log("[POST CATCH]", req.url);
  console.log("BODY:", req.body);
  return res.status(200).send("OK");
});

// Route đăng ký webhook
app.post("/register-webhook", registerWebhook);
// app.post("/webhook/customer.update", customerApi);
app.post("/webhook/invoice.update",billsApi);
// Start server
const PORT = process.env.PORT || 12368;
app.listen(PORT, () => {
  console.log(`Server is running on https://webhook.shophagia.online`);
});
