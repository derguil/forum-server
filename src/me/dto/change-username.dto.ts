import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeUsernameDto {
  @IsString({ message: '아이디가 필요합니다' })
  @IsNotEmpty({ message: '아이디가 필요합니다' })
  username: string;
}
