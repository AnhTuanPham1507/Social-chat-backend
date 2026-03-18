export const VIDEO_TRANSCODING_SERVICE_TOKEN = Symbol('VIDEO_TRANSCODING_SERVICE');

export interface CreateTranscodingJobInput {
  /** Public URL of the source video in R2 */
  sourceUrl: string;
  /** Base path in R2 where HLS output will be stored */
  outputPath: string;
  /** Coconut variant strings, e.g. ["mp4:360p::maxrate=800k", "mp4:720p::maxrate=3000k"] */
  variants: string[];
  /** HLS segment duration in seconds */
  segmentDuration: number;
  /** Unique token for webhook verification */
  webhookToken: string;
}

export interface CreateTranscodingJobOutput {
  jobId: string;
}

export interface IVideoTranscodingService {
  createTranscodingJob(input: CreateTranscodingJobInput): Promise<CreateTranscodingJobOutput>;
}
