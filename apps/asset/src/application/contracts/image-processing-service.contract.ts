import { IMAGE_FORMAT, RESIZING_TYPE } from '@social-chat/domain';

export const IMAGE_PROCESSING_SERVICE_TOKEN = Symbol('IMAGE_PROCESSING_SERVICE');

export interface ProcessImageParams {
  sourceUrl: string;
  presignedUrl: string;
  width?: number;
  height?: number;
  resizingType?: RESIZING_TYPE;
  quality?: number;
  format?: IMAGE_FORMAT;
}

export interface ProcessImageResult {
  format: string;
  size: number;
  originWidth: number;
  originHeight: number;
  resultWidth: number;
  resultHeight: number;
}

export interface IImageProcessingService {
  processImage(params: ProcessImageParams): Promise<ProcessImageResult>;
}
