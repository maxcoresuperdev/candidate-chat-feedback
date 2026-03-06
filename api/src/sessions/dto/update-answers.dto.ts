import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class UpdateAnswersDto {
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  answers!: string[];
}
