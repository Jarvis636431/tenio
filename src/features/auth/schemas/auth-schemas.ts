import { z } from "zod";

const phoneRegex = /^1[3-9]\d{9}$/;
const passwordMinLength = 8;

export const phoneSchema = z.object({
  phone: z.string().min(1, "请输入手机号").regex(phoneRegex, "请输入正确的手机号"),
});

export const smsCodeSchema = z.object({
  smsCode: z.string().min(1, "请输入验证码").length(6, "验证码为6位数字"),
});

export const accountLoginSchema = z.object({
  account: z.string().min(1, "请输入账号"),
  password: z.string().min(1, "请输入密码"),
});

export const phoneLoginSchema = phoneSchema.merge(smsCodeSchema);

export const registerSchema = z
  .object({
    phone: z.string().min(1, "请输入手机号").regex(phoneRegex, "请输入正确的手机号"),
    smsCode: z.string().min(1, "请输入验证码").length(6, "验证码为6位数字"),
    username: z.string().min(2, "用户名至少2个字符").max(20, "用户名最多20个字符"),
    password: z.string().min(passwordMinLength, `密码至少${passwordMinLength}位`),
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  username: z.string().min(2, "用户名至少2个字符").max(20, "用户名最多20个字符"),
  password: z.string().min(passwordMinLength, `密码至少${passwordMinLength}位`),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
export type SmsCodeFormData = z.infer<typeof smsCodeSchema>;
export type AccountLoginFormData = z.infer<typeof accountLoginSchema>;
export type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
