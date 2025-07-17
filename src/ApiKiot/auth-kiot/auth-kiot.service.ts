import { Injectable } from '@nestjs/common';
import { CreateAuthKiotDto } from './dto/create-auth-kiot.dto';
import { UpdateAuthKiotDto } from './dto/update-auth-kiot.dto';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class AuthKiotService {
  prisma = new PrismaClient()

  async getAccessToken() {
     try {
        const params = new URLSearchParams();
        params.append("grant_type", "client_credentials");
        params.append("client_id", "33bce6de-32c6-47ad-b734-9e0573b3f474");
        params.append("client_secret", "4DB765D5BA7D02639828C3A7294900099B097CDE");
        // params.append("Retailer","benthanhtsc")
    
        const response = await axios.post(
          "https://id.kiotviet.vn/connect/token",
          params,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        return `Bearer ${response.data.access_token}`;
        //  return response.data.access_token;
      } catch (error) {
        console.error(
          "Error getting access token:",
          error.response?.data || error.message
        );
        return null;
      }
  }

}
