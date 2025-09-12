import axios from "axios";
import getAccessToken from "./auth.mjs";

export const getAllReturnInvoice = async (accessToken, createdDate) => {
  if (!accessToken) {
    return null;
  }

  let allReturnInvoice = [];
  let currentItem = 0;
  const pageSize = 100;
  let totalReturnInvoice = null;

  while (true) {
    try {
      const response = await axios.get("https://public.kiotapi.com/returns", {
        headers: {
          Authorization: accessToken,
          Retailer: "benthanhtsc",
        },
        params: {
          currentItem,
          pageSize,
          orderBy: "code",
          createdDate,
        },
      });

      const returnInvoice = response.data.data;
      totalReturnInvoice = response.data.data || totalReturnInvoice;

      if (!returnInvoice || returnInvoice.length === 0) {
        break;
      }

      allReturnInvoice = allReturnInvoice.concat(returnInvoice);

      if (
        returnInvoice < pageSize ||
        (totalReturnInvoice && allReturnInvoice >= totalReturnInvoice)
      ) {
        break;
      }

      currentItem += pageSize;
    } catch (error) {
      console.error("Lỗi không thể lấy được bill trả hàng", error.message);
      break;
    }
  }
  console.log(`Tổng số bill trả hàng api: ${allReturnInvoice.length}`);
  return allReturnInvoice;
};

const saveReturnInvoiceToDatabase = async (data) => {
  if (!data || data.length === 0) {
    console.error("Không có bill trả hàng");
    return;
  }

  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const savePromises = batch.map(async (item) => {
      const {  returnDetails, ...rest } = item;
    
    try {
        const checkReturn = await prisma.returnInvoice.findUnique({
            where:{code}
        })

        let upsertedReturn
        if (checkReturn) {
            upsertedReturn = await prisma.returnInvoice.update({
                where:{code},
                data:{
                    ...rest
                }
            })
        } else{
            upsertedReturn = await prisma.returnInvoice.create({
                data:{
                    code,
                    ...rest
                }
            })
        }

        await Promise.all(
            returnDetails.map(async(detail)=>{
                const savedDetail = await prisma.returnDetails.upsert({})
            })
        )
    } catch (error) {
        
    }
    });
  }
};

const updateReturnInvoice = async (createdDate) => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const returnInvoice = await getAllReturnInvoice(accessToken, createdDate);
    if (returnInvoice) {
      await saveReturnInvoiceToDatabase(returnInvoice);
    }
  }
};

export { updateReturnInvoice, saveReturnInvoiceToDatabase };
