import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from './edit.module.css';
import { apiFetch } from '@/lib/apiClient';
import { canEditMarathonTemplate } from '@/lib/templateStatus';

type Template = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  status: 'draft' | 'pending_review' | 'approved';
};

export default function EditTemplatePage() {
  const router = useRouter();
  const { id } = router.query;
  const templateId = typeof id === 'string' ? id : undefined;

  const [template, setTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }

    if (!templateId) return;

    async function load() {
      try {
        const res = await apiFetch(`/api/marathons/${templateId}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить шаблон');
        }

        const data: Template = json.data;
        setTemplate(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setDurationDays(data.durationDays);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, templateId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!templateId) return;

    setError(null);
    setSaving(true);

    try {
      const res = await apiFetch(`/api/marathons/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          durationDays,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось обновить шаблон');
      }

      router.push('/mentor/templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="containerMd">
        <p>Загрузка...</p>
      </main>
    );
  }

  if (error && !template) {
    return (
      <main className="containerMd">
        <p className="error">{error}</p>
        <Link href="/mentor/templates">
          <button className="btn btnOutline">Назад к шаблонам</button>
        </Link>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="containerMd">
        <p>Шаблон не найден.</p>
      </main>
    );
  }

  const isEditable = canEditMarathonTemplate(template.status);

  return (
    <main className="containerMd">
      <h1 className="pageTitle">Основная информация</h1>
      {!isEditable && (
        <p className="error">Этот шаблон на проверке и не может быть изменён.</p>
      )}
      {template.status === 'approved' && (
        <p className="textMuted">
          Шаблон одобрен. Изменения сохранятся сразу и будут видны во всех потоках.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="title">Название</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
            disabled={!isEditable}
            className="input"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={!isEditable}
            className="input"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="durationDays">Длительность (дней)</label>
          <input
            id="durationDays"
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            required
            disabled={!isEditable}
            className="input"
          />
        </div>

        {error && <p className="error">{error}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={saving || !isEditable} className="btn btnPrimary">
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <Link href={`/mentor/templates/${templateId}/intro`}>
            <button type="button" className="btn btnOutline">Предстартовая страница</button>
          </Link>
          <Link href={`/mentor/templates/${templateId}/days`}>
            <button type="button" className="btn btnOutline">Дни</button>
          </Link>
          <Link href="/mentor/templates">
            <button type="button" className="btn btnOutline">Отмена</button>
          </Link>
        </div>
      </form>
    </main>
  );
}
