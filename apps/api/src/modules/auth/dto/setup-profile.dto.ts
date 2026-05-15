import { IsString, MaxLength, MinLength } from "class-validator";

export class SetupProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
