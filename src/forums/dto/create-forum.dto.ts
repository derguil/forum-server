import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateForumDto {
  @IsNotEmpty()
  @IsString()
  title: string
}
