import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InvoiveKiotService } from './invoive-kiot.service';
import { CreateInvoiveKiotDto } from './dto/create-invoive-kiot.dto';
import { UpdateInvoiveKiotDto } from './dto/update-invoive-kiot.dto';
import { query } from 'express';

@Controller('api/invoive-kiot')
export class InvoiveKiotController {
  constructor(private readonly invoiveKiotService: InvoiveKiotService) {}
  @Get("getInvoiceKiot")
  getInvoiceKiot(@Query("accessToken")accessToken:string,@Query("createDate")createdDate:string) {
    return this.invoiveKiotService.getInvoiceKiot(accessToken,createdDate);
  }

}
