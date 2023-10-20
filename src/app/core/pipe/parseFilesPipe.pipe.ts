import {
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseFilesPipe implements PipeTransform {
  async transform(value: any) {
    const files = value;

    if (files && files.images) {
      for (const image of files.images) {
        if (!/(jpg|webp|png|jpeg)/.test(image.mimetype)) {
          throw new UnsupportedMediaTypeException(
            'Invalid file type',
            `Unsupported file type for image: ${image.originalname}`,
          );
        }

        if (image.size > 1 * 1024 * 1024) {
          throw new UnprocessableEntityException(
            'File is too large',
            `Image file size exceeds the limit: ${image.originalname}`,
          );
        }
      }
    }

    return value;
  }
}
