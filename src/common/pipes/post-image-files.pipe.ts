import {
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';

export function createPostImageFilesPipe(required = false) {
  return new ParseFilePipe({
    validators: [
      new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
      new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
    ],
    fileIsRequired: required,
  });
}