import axios from 'axios';
import getAccessToken from './auth.mjs';
import { saveBillsToDatabase } from './invoiceKiot.mjs'; // nhớ import hàm save

// Lấy 1 bill theo id
export const getInvoiceById = async (accessToken, id) => {
  try {
    const response = await axios.get(
      `https://public.kiotapi.com/invoices/${id}`,
      {
        headers: {
          Authorization: accessToken,
          Retailer: 'benthanhtsc',
        },
        params: {
          includePayment: true,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching invoice by id ${id}:`, error.message);
    return null;
  }
};

// Lấy 1 bill theo code
export const getInvoiceByCode = async (accessToken, code) => {
  try {
    const response = await axios.get(
      `https://public.kiotapi.com/invoices/code/${code}`,
      {
        headers: {
          Authorization: accessToken,
          Retailer: 'benthanhtsc',
        },
        params: {
          includePayment: true,
        },
      },
    );
    return response.data; // bill object
  } catch (error) {
    console.error(`❌ Error fetching invoice by code ${code}:`, error.message);
    return null;
  }
};

// Hàm xử lý lưu 1 bill thiếu
const updateOneBill = async ({ id = null, code = null }) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('❌ Không lấy được accessToken');
    return;
  }

  let bill = null;
  if (id) {
    bill = await getInvoiceById(accessToken, id);
  } else if (code) {
    bill = await getInvoiceByCode(accessToken, code);
  }

  if (bill) {
    console.log(`✅ Found bill ${bill.code || bill.id}, saving...`);
    await saveBillsToDatabase([bill]); // truyền mảng để tái sử dụng hàm cũ
  } else {
    console.log(
      `⚠️ Không tìm thấy bill với ${id ? 'id ' + id : 'code ' + code}`,
    );
  }
};

export { updateOneBill };
