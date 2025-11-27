import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NhomlvService } from './nhomlv.service';
import { CreateNhomlvDto } from './dto/create-nhomlv.dto';
import { UpdateNhomlvDto } from './dto/update-nhomlv.dto';

@Controller('api/nhomlv')
export class NhomlvController {
  constructor(private readonly nhomlvService: NhomlvService) { }

  // ----- LẤY DANH SÁCH NHÓM NGÀNH HÀNG -----
  @Get('LayDanhSachNhomLV')
  LayDanhSachNhomLV() {
    return this.nhomlvService.LayDanhSachNhomLV();
  }

  // ----- TẠO NHÓM NGÀNH HÀNG LEVEL 1 -----
  @Post('TaoNhomLv1')
  TaoNhomLv1(@Body() body:any){
    return this.nhomlvService.TaoNhomLv1(body)
  }

  // ----- TẠO NHÓM NGÀNH HÀNG LEVEL 2 -----
  @Post("TaoNhomLv2")
  TaoNhomLv2(@Body() body:any){
    return this.nhomlvService.TaoNhomLv2(body)
  }
  // ----- TẠO NHÓM NGÀNH HÀNH LEVEL 3-----
  @Post('TaoNhomLv3')
  TaoNhomLv3(@Body() body: any) {
    return this.nhomlvService.TaoNhomLv3(body);
  }

  // ----- XÓA NHÓM NGÀNH HÀNH -----
  @Delete('XoaNhomLV')
  XoaNhomLV(@Query('id') id: number) {
    return this.nhomlvService.XoaNhomLV(+id);
  }

  // ----- IMPORT NHỚM LEVEL -----
  @Post('ImportLv')
  ImportLv(@Body() body:any){
    return this.nhomlvService.ImportLv(body)
  }
}
