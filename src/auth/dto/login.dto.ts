import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  // @MinLength(4, { message: '아이디는 최소 4자 이상입니다.' })
  // @MaxLength(20, { message: '아이디는 최대 20자까지 가능합니다.' })
  username: string

  @IsNotEmpty()
  @IsString()
  // @MinLength(8, { message: '비밀번호는 최소 8자 이상입니다.' })
  // @MaxLength(32, { message: '비밀번호는 최대 32자까지 가능합니다.' })
  // @Matches(
  //   /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/,
  //   { message: '비밀번호는 영문, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다.' },
  // )
  password: string
}