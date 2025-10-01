import { PrismaClient } from "@prisma/client"
import getAccessToken from "./auth.mjs"

const prisma = new PrismaClient();

export const getAllTransfers =async(
    accessToken,
)=>{
    if (!accessToken) {
        return null;
    }

    let allTrans=[]
    let currentItem=0
    const pageSize =100
    let totalTrans = null

    while(true){
        try {
            
        } catch (error) {
            
        }
    }
}

const saveTransfersToDatabase=()=>{}

const updateTransfers = async()=>{
    const accessToken = await getAccessToken();
    if (accessToken) {
        const trans= await getAllTransfers(
            accessToken,
        )
        if (trans) {
            await saveTransfersToDatabase(trans)
        }
    }
}

export {saveTransfersToDatabase,updateTransfers}