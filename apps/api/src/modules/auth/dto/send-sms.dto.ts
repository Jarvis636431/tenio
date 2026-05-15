import { IsString, Matches } from "class-validator";

const phoneRegex = /^1[3-9]\d{9}$/;

export class SendSmsDto {
  @IsString()
  @Matches(phoneRegex, { message: "请输入正确的手机号" })
  phone!: string;
}
