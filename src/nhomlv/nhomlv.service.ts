import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateNhomlvDto } from './dto/create-nhomlv.dto';
import { UpdateNhomlvDto } from './dto/update-nhomlv.dto';
import { PrismaClient } from '@prisma/client';
import pLimit from 'p-limit';

@Injectable()
export class NhomlvService {

    prisma = new PrismaClient

    // ----- LẤY DANH SÁCH NHÓM NGÀNH HÀNG -----
    async LayDanhSachNhomLV() {
        // Lấy toàn bộ danh mục
        const danhMuc = await this.prisma.category.findMany();

        // Hàm để xây dựng cây phân cấp
        const buildTree = (parentId = null) => {
            return danhMuc
                .filter(item => item.parent_id === parentId) // Lọc các danh mục con theo parent_id
                .map(item => ({
                    ...item,
                    children: buildTree(item.id) // Đệ quy để lấy danh mục con
                }));
        };

        const content = buildTree(); // Xây dựng cây từ cấp gốc

        return { message: 'Thành Công', content, date: new Date() };
    }

    // ----- TẠO NHÓM NGÀNH HÀNG LEVEL 1 -----
    async TaoNhomLv1(body: any) {

        let checkTenLv1 = await this.prisma.category.findFirst({
            where: {
                name: body.name
            }
        })

        if (checkTenLv1) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: "Tên nhóm Level 1 đã tồn tại"
            }, HttpStatus.BAD_REQUEST)
        }

        const lastId = await this.prisma.category.findFirst({
            where: { level: 1 },
            orderBy: { id: 'desc' },
        });

        const idLv1 = lastId ? lastId.id + 1 : 200;

        let data = await this.prisma.category.create({
            data: {
                id: idLv1,
                name: body.name,
                level: 1,
                isActive: true,
                createDate: new Date()
            }
        })

        return { message: "Thành công", data, date: new Date() }
    }
    // ----- TẠO NHÓM NGÀNH HÀNG LEVEL 2 -----
    async TaoNhomLv2(body: any) {
        let checkTenLv2 = await this.prisma.category.findFirst({
            where: {
                name: body.name
            }
        })

        if (checkTenLv2) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: "Tên nhóm Level 2 này đã tồn tại"
            }, HttpStatus.BAD_REQUEST)
        }

        let lastId = await this.prisma.category.findFirst({
            where: {
                level: 2
            },
            orderBy: { id: "desc" }
        })

        const idLv2 = lastId ? lastId.id + 1 : 100;

        let data = await this.prisma.category.create({
            data: {
                id: idLv2,
                name: body.name,
                level: 2,
                parent_id: 200,
                isActive: true,
                createDate: new Date()
            }
        })
    }

    // ----- TẠO NHÓM NGÀNH HÀNG LEVEL 3 -----
    async TaoNhomLv3(body: any) {
        let checkTenLv3 = await this.prisma.category.findFirst({
            where: {
                name: body.name
            }
        })

        if (checkTenLv3) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: "Tên nhóm level 3 này đã tồn tại"
            }, HttpStatus.BAD_REQUEST)
        }

        let lastId = await this.prisma.category.findFirst({
            where: {
                level: 3
            },
            orderBy: {
                id: "desc"
            }
        })

        let idLv3: number


        if (body.id === 200) {
            idLv3 = lastId ? lastId.id + 1 : 1;
        }
        else if (body.id === 201) {
            idLv3 = lastId ? lastId.id + 1 : 300;
        }
        else if (body.id === 202) {
            idLv3 = lastId ? lastId.id + 1 : 400
        }
        else if (body.id === 203) {
            idLv3 = lastId ? lastId.id + 1 : 500
        }
        else if (body.id === 204) {
            idLv3 = lastId ? lastId.id + 1 : 600
        }
        else if (body.id === 205) {
            idLv3 = lastId ? lastId.id + 1 : 700

        } else {
            return { message: "Vui lòng tạo nhóm cha trước" }
        }

        let data = await this.prisma.category.create({
            data: {
                id: idLv3,
                name: body.name,
                level: 3,
                parent_id: body.parent_id,
                isActive: true,
                createDate: new Date()
            }
        })
    }

    // ----- XÓA NHÓM NGÀNH HÀNG -----
    async XoaNhomLV(id: number) {

        let checkNhomLV = await this.prisma.category.findFirst({
            where: {
                id: id,
            }
        })
        if (!checkNhomLV) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                messenge: "Nhóm ngành hàng không tồn tại",
            }, HttpStatus.BAD_REQUEST)
        }

        let removeNhomLV = await this.prisma.category.update({
            where: {
                id: id
            },
            data: {
                isActive: false,
            }
        })
        return { messenge: 'Xóa thành công', removeNhomLV, date: new Date() }
    }

    // ----- IMPORT NHÓM LEVEL -----
    async ImportLv(body: any[]) {
        const limit = pLimit(10);

        const tasks = body.map(item =>
            limit(async () => {
                if (!item.id) {
                    return { message: "Mã level không có", item };
                }

                // Format mã level về số thực (vì đang là "001")
                const formatId = Number(item.id);

                // Tạo hoặc tìm level
                try {
                    await this.prisma.category.upsert({
                        where: { id: formatId },
                        update: {
                            modifiedDate:new Date()
                        },                     
                        create: {
                            id: formatId,
                            name: item.name,
                            level: Number(item.level),
                            parent_id: item.parent_id||null,
                            isActive: true,
                            createDate: new Date(),
                        
                         
                        }
                    });
                    return { message: "Đã xử lý", item };
                } catch (error) {
                    
                }

            })
        );

        const results = await Promise.all(tasks);
        return results;
    }

}




