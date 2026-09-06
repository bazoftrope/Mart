export type AttachmentKind = 'audio' | 'video' | 'file';
export type AttachmentScope = 'intro' | 'day';

export type AttachmentData = {
  id?: string;
  kind: AttachmentKind;
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  position?: number;
};

export type AttachmentInput = {
  kind: AttachmentKind;
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  position?: number;
};
