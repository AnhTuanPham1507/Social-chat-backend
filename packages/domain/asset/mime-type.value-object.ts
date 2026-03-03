import {
    DomainPrimitiveProperties,
    ValueObject,
    ValueObjectProperties,
} from '@beincom/domain';

export enum MIME_TYPE {
    // Image MIME Types
    JPEG = 'image/jpeg',
    PNG = 'image/png',
    GIF = 'image/gif',
    WEBP = 'image/webp',
    SVG = 'image/svg+xml',
    TIFF = 'image/tiff',
    BMP = 'image/bmp',

    // Video MIME Types
    MP4 = 'video/mp4',
    WEBM = 'video/webm',
    OGG_VIDEO = 'video/ogg',
    AVI = 'video/avi',
    MPEG = 'video/mpeg',
    QUICKTIME = 'video/quicktime',

    // Audio MIME Types
    MP3 = 'audio/mpeg',
    WAV = 'audio/wav',
    OGG_AUDIO = 'audio/ogg',
    WEBM_AUDIO = 'audio/webm',
    FLAC = 'audio/flac',
    AAC = 'audio/aac',

    // Document MIME Types
    PDF = 'application/pdf',
    ZIP = 'application/zip',
    PLAIN_TEXT = 'text/plain',
    JSON = 'application/json',
    CSV = 'text/csv',
    HTML = 'text/html',
}

export class MimeType extends ValueObject<MIME_TYPE> {
    constructor(props: ValueObjectProperties<MIME_TYPE>) {
        super(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public validate({}: DomainPrimitiveProperties<MIME_TYPE>): void {}

    public static fromString(value: MIME_TYPE): MimeType {
        return new MimeType({ value });
    }
}
