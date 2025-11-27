import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateNccDto } from './dto/create-ncc.dto';
import { UpdateNccDto } from './dto/update-ncc.dto';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { log } from 'console';
const pLimit = require('p-limit');


@Injectable()
export class NccService {

  prisma = new PrismaClient

  // ----- LẤY DANH SÁCH NHÀ CUNG CẤP ----- //
  async LayDanhSachNCC() {
    let content = await this.prisma.suppliersLocal.findMany({
      orderBy: {
        name: "asc"
      }
    })

    return { message: 'Thành Công', content, date: new Date() }
  }

  // ----- TẠO NHÀ CUNG CẤP ----- //
  async TaoNCC(body: any) {

    let checkMaNCC = await this.prisma.suppliersLocal.findFirst({
      where: { code: body.code },
    });

    if (checkMaNCC) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        message: "Mã nhà cung cấp đã tồn tại",
      }, HttpStatus.BAD_REQUEST);
    }

    let checkTenNCC = await this.prisma.suppliersLocal.findFirst({
      where: { name: body.name },
    });
    if (checkTenNCC) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        message: "Tên nhà cung cấp đã tồn tại",

      }, HttpStatus.BAD_REQUEST);
    }

    let checkMST = await this.prisma.suppliersLocal.findFirst({
      where: { taxCode: body.taxCode },
    });

    if (checkMST) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        message: "Mã số thuế đã tồn tại",
      }, HttpStatus.BAD_REQUEST);
    }

   const createDate = new Date()
    let data = await this.prisma.suppliersLocal.create({
      data: {
        code: body.code,
        name: body.name,
        organization: body.organization || null,
        taxCode: body.taxCode,
        contactNumber: body.contactNumber,
        address: body.address,
        createdDate: createDate,
        isActive: true,
      }
    })
    return { message: 'Thành Công', data, date: new Date() }
  }

  // ----- XÓA NHÀ CUNG CẤP ----- //
  async XoaNCC(id: number) {
    let checkMaNCC = await this.prisma.suppliersLocal.findFirst({
      where: {
        id: Number(id),
      }
    })
    if (!checkMaNCC) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        message: "Nhà cung cấp không tồn tại",
      }, HttpStatus.BAD_REQUEST);
    }
    const modifiedDate = new Date()

    let removeMaNCC = await this.prisma.suppliersLocal.update({
      where: {
        id: Number(id),
      },
      data: {
        isActive: false,
        modifiedDate: modifiedDate
      }
    })

    return { message: "Xóa thành công", removeMaNCC, date: new Date() }
  }

  // ----- EDIT NHÀ CUNG CẤP ----- //
  async EditNCC(body: any) {
    let checkMaNCC = await this.prisma.suppliersLocal.findFirst({
      where: {
        code: body.code,
      }
    })

    if (!checkMaNCC) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        message: "Mã nhà cung cấp không tồn tại tồn tại",
      }, HttpStatus.BAD_REQUEST);
    }


    const modifiedDate = new Date()

    let editNcc = await this.prisma.suppliersLocal.update({
      where: {
        code: body.code,
      },
      data: {
        
        code: body.code,
        name: body.name,
        organization: body.organization,
        taxCode: body.taxCode,
        contactNumber: body.contactNumber,
        address: body.address,
        email: body.email,
        modifiedDate: modifiedDate
      }
    })
    return { message: 'Thành Công', editNcc, date: new Date() }
  }

  // ----- IMPORT NHÀ CUNG CẤP ----- //
  async ImportNcc(body: any[]) {
    const limit = pLimit(10); // chỉ chạy 5 promise cùng lúc

    const tasks = body.map(item => limit(async () => {
      if (!item.code) {
        console.error("Bỏ qua dòng vì thiếu Mã NCC:", item);
        return;
      }

      const supplierData = {
        code: String(item.code),
        organization: item.organization ? String(item.organization) : '',
        name: item.name ? String(item.name) : '',
        taxCode: item.taxCode ? String(item.taxCode) : '',
        contactNumber: item.contactNumber ? String(item.contactNumber) : '',
        address: item.address ? String(item.address) : '',
        email: item.email ? String(item.email) : '',
        isActive: true,

      };

      const checkNcc = await this.prisma.suppliersLocal.findUnique({
        where: { code: item.code }
      });

      if (checkNcc) {
        return this.prisma.suppliersLocal.update({
          where: { code: item.code },
          data: { ...supplierData, modifiedDate: new Date() }
        });
      } else {
        return this.prisma.suppliersLocal.create({
          data: { ...supplierData as Prisma.suppliersUncheckedCreateInput, createdDate: new Date() }
        });
      }
    }));

    try {
      await Promise.all(tasks);
      return { messenge: 'Dữ liệu đã được import thành công!' };
    } catch (err) {
      console.error(err);
      throw new Error('Đã xảy ra lỗi khi import NCC!');
    }
  }



}


