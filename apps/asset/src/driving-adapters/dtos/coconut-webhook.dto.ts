export interface CoconutWebhookOutput {
  key: string;
  type: string;
  format: string;
  status: string;
  url?: string;
  urls?: string[];
  metadata?: Record<string, any>;
}

export interface CoconutWebhookInput {
  status: string;
  metadata?: Record<string, any>;
}

export interface CoconutWebhookData {
  type: string;
  status: string;
  progress?: string;
  id: string;
  createdAt?: string;
  completedAt?: string;
  input?: CoconutWebhookInput;
  outputs?: CoconutWebhookOutput[];
}

export interface CoconutWebhookBody {
  jobId: string;
  event: string;
  metadata?: boolean;
  data: CoconutWebhookData;
}

/**
 * Maps the raw snake_case Coconut webhook payload to our camelCase interface.
 */
export function mapCoconutWebhookBody(
  raw: Record<string, any>,
): CoconutWebhookBody {
  const rawData = raw.data ?? {};

  return {
    jobId: raw.job_id,
    event: raw.event,
    metadata: raw.metadata,
    data: {
      type: rawData.type,
      status: rawData.status,
      progress: rawData.progress,
      id: rawData.id,
      createdAt: rawData.created_at,
      completedAt: rawData.completed_at,
      input: rawData.input,
      outputs: rawData.outputs,
    },
  };
}
