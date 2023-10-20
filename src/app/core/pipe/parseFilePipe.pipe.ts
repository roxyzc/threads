import {
  Injectable,
  PipeTransform,
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseFilePipe implements PipeTransform {
  async transform(value: any) {
    const file = value;

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!/(jpg|webp|png|jpeg)/.test(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        'Invalid file type',
        'Unsupported file type for image',
      );
    }

    if (file.size > 1 * 1024 * 1024) {
      throw new UnprocessableEntityException(
        'File is too large',
        'Image file size exceeds the limit',
      );
    }

    return value;
  }
}
