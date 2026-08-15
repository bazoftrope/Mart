import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import Chat from '@/components/Chat/Chat';

export default function MentorMessagesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    useAuthStore.getState().initAuth();
    const currentRole = useAuthStore.getState().role;
    if (currentRole !== 'mentor') {
      router.push('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready || !userId) return null;

  const { conversationId, streamId, participantId, group } = router.query;

  return (
    <main className="container">
      <h1 className="pageTitle">Сообщения</h1>
      <Chat
        myUserId={userId}
        autoOpen={{
          conversationId:
            typeof conversationId === 'string' ? conversationId : undefined,
          streamId: typeof streamId === 'string' ? streamId : undefined,
          participantId:
            typeof participantId === 'string' ? participantId : undefined,
          group: group === '1',
        }}
      />
    </main>
  );
}
