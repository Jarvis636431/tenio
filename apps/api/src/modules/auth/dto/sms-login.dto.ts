import { IsBoolean, IsOptional, IsString, Length, Matches } from "class-validator";

const phoneRegex = /^1[3-9]\d{9}$/;

export class SmsLoginDto {
  @IsString()
  @Matches(phoneRegex, { message: "请输入正确的手机号" })
  phone!: string;

  @IsString()
  @Length(6, 6)
  sms_code!: string;

  @IsOptional()
  @IsBoolean()
  has_agreed_terms?: boolean;
}
