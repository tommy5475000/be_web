import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateInvoiceItDto } from './dto/create-invoice-it.dto';
import { UpdateInvoiceItDto } from './dto/update-invoice-it.dto';
import { PrismaClient } from '@prisma/client';
import { InvoiceIt } from './entities/invoice-it.entity';

@Injectable()
export class InvoiceItService {
  prisma = new PrismaClient

  // ----- LẤY THÔNG TIN HÓA ĐƠN ----- //
  async getDataXml() {
    let content = await this.prisma.invoiceIt.findMany({
      orderBy: {
        ngayHd: "desc"
      }
    })
    return { message: "Thành công", content, date: new Date() }
  }

  // ----- IMPORT XML ----- //
  async importXml(body: any) {
    console.log(body);
    try {
      return this.prisma.$transaction(async (tx) => {
        const checkInv = await tx.invoiceIt.findFirst({
          where: {
            AND: [
              { soHd: parseInt(body.soHd) },
              { kyHieuHd: body.kyHieuHd }
            ]
          }
        })

        if (checkInv) {
          throw new HttpException({
            status: HttpStatus.BAD_REQUEST,
            message: `Hóa đơn số ${body.soHd} (${body.kyHieuHd}) đã tồn tại trong hệ thống.`
          }, HttpStatus.BAD_REQUEST)
        }


        const data = await this.prisma.invoiceIt.create({
          data: {
            soHd: parseInt(body.soHd),
            kyHieuHd: body.kyHieuHd,
            ngayHd: body.ngayHd, // Là string như định nghĩa
            loaiHinh: body.loaiHinh,
            noiDung: body.noiDung || '',
            tienThue: parseInt(body.tienThue),
            tongTien: parseInt(body.tongTien),
            ptThanhToan: body.ptThanhToan || '',
            mst: body.mst,
            tenNcc: body.tenNcc,
            diaChi: body.diaChi,
            soDt: body.soDt,
            email: body.email,
            stk: body.stk,
            nganHang: body.nganHang,
            webSite: body.webSite,
            createDate: new Date(),
            userId: body.userId || null,
            soTienBangChu: body.soTienBangChu
          }
        });

        if (Array.isArray(body.danhSachHang) && body.danhSachHang.length > 0) {
          await tx.invoiceItDetails.createMany({
            data: body.danhSachHang.map(item => {
              const tienThueItem = item.TSuat
                ? Math.round(parseInt(item.ThTien || '0') * parseFloat(item.TSuat) / 100)
                : parseInt(item.tienThue || '0') || 0;
              return {
                invoiceItId:data.id,
                // soHd: parseInt(body.soHd),
                danhSachHang: item.THHDVu,
                dvt: item.DVTinh ||"",
                sl: parseInt(item.SLuong),
                donGia: parseInt(item.DGia),
                thanhTienTruocVat: parseInt(item.ThTien),
                loaiThue: item.TSuat || '',
                tienThueDongHang: tienThueItem||0,
                thanhTien: parseInt(body.thanhTien || '0'),
                tongTien: parseInt(body.tongTien || '0'),
                createDate: new Date(),
                userId: body.userId || null
              };
            })
          });
        }
        return { message: "Thành công", data, date: new Date() }
      })
    } catch (error) {
    }
  }

  // ----- CREATEINV ----- //
  async createInv(body: any) {
    const checkSoHd = await this.prisma.invoiceIt.findFirst({
      where: {
        AND: [
          { soHd: parseInt(body.soHd) },
          { kyHieuHd: body.kyHieuHd }
        ]
      }
    })

    if (checkSoHd) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        message: "Số hóa đơn theo ký hiệu này đã tồn tại"
      }, HttpStatus.BAD_REQUEST)
    }

    const tongTien = Array.isArray(body.chiTiet) ? body.chiTiet.reduce((sum, item) => {
      const sl = parseInt(item.sl) || 0
      const donGia = parseFloat(item.donGia) || 0
      const tyGia = body.tyGia ? parseFloat(body.tiGia) : 1
      return sum + sl * donGia * tyGia
    }, 0) : 0;

    const data = await this.prisma.invoiceIt.create({
      data: {
        soHd: body.soHd,
        kyHieuHd: body.kyHieuHd,
        ngayHd: body.ngayHd,
        tenNcc: body.tenNcc,
        diaChi: body.diaChi,
        noiDung: body.noiDung,
        tienThue: body.tienThue || 0,
        tongTien: tongTien,
        ptThanhToan: body.ptThanhToan || '',
        loaiHinh: body.loaiHinh,
        createDate: new Date(),
        mst: body.mst,
        tyGia: parseInt(body.tyGia),
        stk: body.stk,
        caNhan: body.caNhan,
        nganHang: body.nganHang,
        userId: body.userId || null,
        soTienBangChu: body.soTienBangChu || null
      }
    });
    if (Array.isArray(body.chiTiet) && body.chiTiet.length > 0) {
      await this.prisma.invoiceItDetails.createMany({
        data: body.chiTiet.map((item) => ({
          invoiceItId:data.id,
          soHd: body.soHd, 
          danhSachHang: item.tenHang,
          dvt: item.dvt || "Lần",
          sl: parseInt(item.sl),
          donGia: parseFloat(item.donGia),
          thanhTienTruocVat: parseInt(item.sl) * parseFloat(item.donGia),
          loaiThue: item.loaiThue || "KCT",
          tienThueDongHang: item.tienThueDongHang || 0,
          thanhTien: item.thanhTien || 0,
          tongTien: tongTien,
          userId: item.userId || null,
          createDate: new Date()
        }))
      });
    }
    return { message: "Thành công", data, date: new Date() }

  }

  // ----- UPLOAD FILE SCAN ----- //
  async uploadScan() {

  }
}
