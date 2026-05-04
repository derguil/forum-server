import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { IsInt, Min, IsOptional } from 'class-validator';

export class CreatePostDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  forumId: number

  @IsNotEmpty()
  @IsString()
  title: string

  @IsNotEmpty()
  @IsString()
  content: string
}