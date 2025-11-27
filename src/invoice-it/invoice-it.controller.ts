import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InvoiceItService } from './invoice-it.service';
import { CreateInvoiceItDto } from './dto/create-invoice-it.dto';
import { UpdateInvoiceItDto } from './dto/update-invoice-it.dto';

@Controller('api/invoice-it')
export class InvoiceItController {
  constructor(private readonly invoiceItService: InvoiceItService) { }

  // ----- LẤY THÔNG TIN HÓA ĐƠN ----- //
  @Get("getDataXml")
  getDataXml() {
    return this.invoiceItService.getDataXml()
  }

  // ----- IMPORT XML ----- //
  @Post("importXml")
  importXml(@Body() body: any) {
    return this.invoiceItService.importXml(body)
  }

  // ----- CREATE INV ----- //
  @Post("createInv")
  createInv(@Body() body:any){
    return this.invoiceItService.createInv(body)
  }

  // ----- REMOVE INV ----- //
  @Delete("removeInv")
  removeInv(@Query('id') id:number){
    return this.invoiceItService.removeInv(id)
  }

  // ----- EDIT INV ----- //
  @Post('editInv')
  editInv(@Body() body:any){
    return this.invoiceItService.editInv(body)
  }

  // ----- UPLOAD FILE SCAN ----- //
  @Post("uploadScan")
  uploadScan(){
    
  }

}
