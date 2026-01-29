import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UserService {
  prisma = new PrismaClient();

  // ----- LẤY THÔNG TIN USER ----- //
  async getAllUser() {
    const content = await this.prisma.users.findMany();
    return { message: 'Thành công', content, date: new Date() };
  }

  // ----- TẠO USER ----- //
  async createUser(body: any) {
    const checkUser = await this.prisma.users.findFirst({
      where: {
        AND: [{ userName: body.userName }, { email: body.email }],
      },
    });

    if (checkUser) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: 'Tài khoản này đã tồn tại',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.prisma.users.create({
      data: {
        userName: body.userName,
        pass: body.pass,
        email: body.email,
        brithday: body.brithday,
        phone: body.phone,
        fullName: body.fullName,
        createDate: new Date(),
        status: true,
        vaiTro: body.vaiTro,
        address: body.address,
      },
    });

    return { message: 'Thành công', data, date: new Date() };
  }
}
