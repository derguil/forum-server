import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateRoomDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  postId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetUserId: number;
}