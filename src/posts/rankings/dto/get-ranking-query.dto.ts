import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, IsIn, IsEnum } from 'class-validator';
import { RankingType } from '@prisma/client';

export class GetRankingQueryDto {
  @IsEnum(RankingType)
  type!: RankingType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
