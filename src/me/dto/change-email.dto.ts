import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailDto {
  @IsNotEmpty({ message: 'email이 필요합니다' })
  @IsEmail({}, { message: '유효한 email 형식이 아닙니다' })
  email: string;
}
