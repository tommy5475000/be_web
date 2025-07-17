import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NccService } from './ncc.service';
import { CreateNccDto } from './dto/create-ncc.dto';
import { UpdateNccDto } from './dto/update-ncc.dto';

@Controller('api/ncc')
export class NccController {
  constructor(private readonly nccService: NccService) { }

  // ----- LẤY DANH SÁCH NHÀ CUNG CẤP ----- //
  @Get('LayDanhSachNCC')
  LayDanhSachNCC() {
    return this.nccService.LayDanhSachNCC();
  }

  // ----- TẠO NHÀ CUNG CẤP ----- //
  @Post('TaoNCC')
  TaoNCC(@Body() body: any) {
    return this.nccService.TaoNCC(body);
  }

  // ----- XÓA NHÀ CUNG CẤP ----- //
  @Delete('XoaNCC')
  XoaNCC(@Query('id') id: number) {
    return this.nccService.XoaNCC(id);
  }

  // ----- EDIT NHÀ CUNG CẤP ----- //
  @Post('EditNCC')
  EditNCC(@Body() body: any) {
    return this.nccService.EditNCC(body);
  }

  // ----- IMPORT NHÀ CUNG CẤP ----- //
  @Post('ImportNcc')
  ImportNcc(@Body() body: any) {
    return this.nccService.ImportNcc(body)
  }

}