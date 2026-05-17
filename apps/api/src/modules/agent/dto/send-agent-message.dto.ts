import { IsNotEmpty, IsString } from "class-validator";

export class SendAgentMessageDto {
  @IsString()
  @IsNotEmpty()
  content_text!: string;
}
