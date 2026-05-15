import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  project_name!: string;
}
