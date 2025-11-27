import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthKiotService } from './auth-kiot.service';
import { CreateAuthKiotDto } from './dto/create-auth-kiot.dto';
import { UpdateAuthKiotDto } from './dto/update-auth-kiot.dto';

@Controller('api/auth-kiot')
export class AuthKiotController {
  constructor(private readonly authKiotService: AuthKiotService) {}

  @Get("token")
  getAccessToken() {
    return this.authKiotService.getAccessToken();
  }

}
