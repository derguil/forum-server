import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional } from 'class-validator';

export class GetPostsDto {
  // @IsOptional()
  @Type(() => Number)
  @IsInt()
  forumId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
