import { PartialType } from '@nestjs/mapped-types';
import { CreateNccDto } from './create-ncc.dto';

export class UpdateNccDto extends PartialType(CreateNccDto) {}
