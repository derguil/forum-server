import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional } from 'class-validator';

export class GetCommentsDto {
  @Type(() => Number)
  @IsInt()
  postId: number;
}
