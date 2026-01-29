import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ----- LẤY THÔNG TIN USER ----- //
  @Get('getAllUser')
  getAllUser() {
    return this.userService.getAllUser();
  }

  // ----- TẠO USER ----- //
  @Post('createUser')
  createUser(@Body() body: any) {
    return this.userService.createUser(body);
  }
}
