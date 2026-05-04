import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { IsInt, Min, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  postId: number

  @IsNotEmpty()
  @IsString()
  content: string
}