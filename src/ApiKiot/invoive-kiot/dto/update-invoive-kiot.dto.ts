import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiveKiotDto } from './create-invoive-kiot.dto';

export class UpdateInvoiveKiotDto extends PartialType(CreateInvoiveKiotDto) {}
