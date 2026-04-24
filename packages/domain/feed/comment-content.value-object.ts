import { BadRequestException } from '@nestjs/common';

const MAX_COMMENT_CONTENT_LENGTH = 2000;

export class CommentContent {
  private constructor(private readonly _value: string) {}

  static fromString(value?: string): CommentContent {
    const trimmed = (value ?? '').trim();

    if (trimmed.length > MAX_COMMENT_CONTENT_LENGTH) {
      throw new BadRequestException(
        `Comment content must not exceed ${MAX_COMMENT_CONTENT_LENGTH} characters`,
      );
    }

    return new CommentContent(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
