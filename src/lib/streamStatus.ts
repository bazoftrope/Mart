import 'reflect-metadata';
import { Stream, MarathonTemplate } from '@db/models';
import type { StreamStatus } from '@db/models/Stream';
import { syncStreamStatus } from './streamCompleter';

export async function ensureStreamStatus(streamId: string): Promise<StreamStatus> {
  const stream = await Stream.findByPk(streamId);
  if (!stream) {
    return 'open';
  }

  const template = await MarathonTemplate.findByPk(stream.templateId, {
    attributes: ['durationDays'],
  });

  if (stream.status === 'open' || stream.status === 'running') {
    await syncStreamStatus(stream, template?.durationDays ?? 0);
  }

  return stream.status;
}
