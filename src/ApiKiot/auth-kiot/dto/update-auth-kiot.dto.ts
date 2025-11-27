import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthKiotDto } from './create-auth-kiot.dto';

export class UpdateAuthKiotDto extends PartialType(CreateAuthKiotDto) {}
