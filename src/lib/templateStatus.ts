export type MarathonTemplateStatus = 'draft' | 'pending_review' | 'approved';

/**
 * Шаблон можно редактировать ментору в статусах draft и approved.
 * pending_review заблокирован, пока админ проверяет.
 */
export function canEditMarathonTemplate(status: MarathonTemplateStatus): boolean {
  return status === 'draft' || status === 'approved';
}
