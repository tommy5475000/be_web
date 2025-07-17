import { PartialType } from '@nestjs/mapped-types';
import { CreateNhomlvDto } from './create-nhomlv.dto';

export class UpdateNhomlvDto extends PartialType(CreateNhomlvDto) {}
