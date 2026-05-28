import { IsNotEmpty, IsString } from "class-validator";

export class UploadCompleteDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
