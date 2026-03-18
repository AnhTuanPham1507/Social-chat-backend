import { BadRequestException } from '@nestjs/common';

const MAX_POST_CONTENT_LENGTH = 5000;

export class PostContent {
  private constructor(private readonly _value: string | undefined) {}

  static fromString(value?: string): PostContent {
    if (value !== undefined && value !== null) {
      const trimmed = value.trim();
      if (trimmed.length > MAX_POST_CONTENT_LENGTH) {
        throw new BadRequestException(
          `Post content must not exceed ${MAX_POST_CONTENT_LENGTH} characters`,
        );
      }
      return new PostContent(trimmed.length > 0 ? trimmed : undefined);
    }
    return new PostContent(undefined);
  }

  get value(): string | undefined {
    return this._value;
  }
}
