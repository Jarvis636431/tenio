import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class PasswordLoginDto {
  @IsString()
  @IsNotEmpty()
  account!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsBoolean()
  has_agreed_terms?: boolean;
}
