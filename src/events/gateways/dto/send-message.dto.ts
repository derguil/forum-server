import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class SendMessageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
