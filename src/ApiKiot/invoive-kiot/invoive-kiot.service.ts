import { Injectable } from '@nestjs/common';
import { CreateInvoiveKiotDto } from './dto/create-invoive-kiot.dto';
import { UpdateInvoiveKiotDto } from './dto/update-invoive-kiot.dto';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { AuthKiotService } from '../auth-kiot/auth-kiot.service';

@Injectable()
export class InvoiveKiotService {
  constructor(
    private readonly authKiotService: AuthKiotService,
  ) { }

  prisma = new PrismaClient()
  async getInvoiceKiot(accessToken: string, createdDate: string) {
    if (!accessToken) {
      return null;
    }

    let allBills = [];
    let currentItem = 0;
    const pageSize = 100;
    let totalBills = null;

    while (true) {
      try {
        const response = await axios.get("https://public.kiotapi.com/invoices", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Retailer: "benthanhtsc",
          },
          params: {
            currentItem,
            pageSize,
            includePayment: true,
            orderBy: "code",
            createdDate
          },
        });

        const bills = response.data.data;
        totalBills = response.data.total || totalBills;

        if (!bills || bills.length === 0) {
          break;
        }

        allBills = allBills.concat(bills);

        if (
          bills.length < pageSize ||
          (totalBills && allBills.length >= totalBills)
        ) {
          break;
        }

        currentItem += pageSize;
      } catch (error) {
        console.error("Error fetching invoices:", error.message);
        break;
      }
    }
    console.log(`Tổng số bill api: ${allBills.length} `);
    return allBills;
  };

  saveBillsToDatabase = async (data: any) => {
    if (!data || data.length === 0) {
      console.error("No invoices to save");
      return;
    }

    const batchSize = 100; // Xử lý mỗi lần 50 hóa đơn
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const savePromises = batch.map(async (bill) => {
        const {
          code: sohd,
          invoiceDetails,
          payments: payBills,
          ...rest
        } = bill;

        try {

          const checkBill = await this.prisma.invoice.findUnique({
            where: { sohd },
          });

          let upsertedBill;
          if (checkBill) {
            upsertedBill = await this.prisma.invoice.update({
              where: { sohd },
              data: {
                ...rest,
                // modifiedDate: formattedModifiedDate,
              },
            });
          } else {
            upsertedBill = await this.prisma.invoice.create({
              data: {
                sohd,
                ...rest,
              },
            });
          }

          // Lưu chi tiết hóa đơn nếu có
          await Promise.all(
            invoiceDetails.map(async (detail) => {
              return this.prisma.invoiceDetails.upsert({
                where: {
                  invoiceId_productCode: {
                    invoiceId: upsertedBill.sohd,
                    productCode: detail.productCode,
                  },
                },
                update: {
                  productId: detail.productId,
                  productCode: detail.productCode,
                  productName: detail.productName,
                  quantity: detail.quantity,
                  price: detail.price,
                  discount: detail.discount,
                  categoryId: detail.categoryId,
                  categoryName: detail.categoryName,
                  tradeMarkId: detail.tradeMarkId,
                  tradeMarkName: detail.tradeMarkName,
                  subTotal: detail.subTotal,
                  returnQuantity: detail.returnQuantity,
                  discountRatio: detail.discountRatio,
                  usePoint: detail.usePoint,
                },
                create: {
                  invoiceId: upsertedBill.sohd,
                  productId: detail.productId,
                  productCode: detail.productCode,
                  productName: detail.productName,
                  quantity: detail.quantity,
                  price: detail.price,
                  discount: detail.discount,
                  categoryId: detail.categoryId,
                  categoryName: detail.categoryName,
                  tradeMarkId: detail.tradeMarkId,
                  tradeMarkName: detail.tradeMarkName,
                  subTotal: detail.subTotal,
                  returnQuantity: detail.returnQuantity,
                  discountRatio: detail.discountRatio,
                  usePoint: detail.usePoint,
                },
              });
            })
          );

          // Lưu chi tiết thanh toán hóa đơn nếu có

          await Promise.all(
            payBills.map((detail) => {
              return this.prisma.payBills.upsert({
                where: {
                  invoiceId_code: {
                    invoiceId: upsertedBill.sohd,
                    code: detail.code,
                  },
                },
                update: {
                  amount: detail.amount,
                  method: detail.method,
                  accountId: detail.accountId,
                  bankAccount: detail.bankAccount,
                  status: detail.status,
                  description: detail.description,
                  statusValue: detail.statusValue,
                  transDate: detail.transDate,
                },
                create: {
                  invoiceId: upsertedBill.sohd,
                  id_pay: detail.id,
                  code: detail.code,
                  amount: detail.amount,
                  method: detail.method,
                  accountId: detail.accountId,
                  bankAccount: detail.bankAccount,
                  status: detail.status,
                  statusValue: detail.statusValue,
                  description: detail.description,
                  transDate: detail.transDate,
                },
              });
            })
          );

          console.log(`Invoice ${sohd} saved or updated.`);
        } catch (error) {
          console.error(
            `Error saving invoice ${sohd}:`,
            error.message,
            error.stack
          );
        }
      });
      await Promise.all(savePromises);
    }
  };

  updateBills = async (createdDate: string) => {
    const accessToken = await this.authKiotService.getAccessToken(); if (accessToken) {
      const bills = await this.getInvoiceKiot(accessToken, createdDate);
      if (bills) {
        await this.saveBillsToDatabase(bills);
      }
    }
  }
}
