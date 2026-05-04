import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: '비밀번호 정보가 필요합니다' })
  @IsNotEmpty({ message: '비밀번호 정보가 필요합니다' })
  currentPassword: string;

  @IsString({ message: '비밀번호 정보가 필요합니다' })
  @IsNotEmpty({ message: '비밀번호 정보가 필요합니다' })
  newPassword: string;
}
