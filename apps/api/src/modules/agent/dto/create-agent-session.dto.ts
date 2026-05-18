import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAgentSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  session_title?: string;
}
