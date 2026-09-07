import AudioPlayer from 'react-h5-audio-player';
import type { AttachmentData } from '@/types/attachments';
import { groupPairedAttachments } from '@/lib/attachmentGroups';
import styles from './AttachmentPairCards.module.css';

type AttachmentPairCardsProps = {
  attachments: AttachmentData[];
};

export default function AttachmentPairCards({ attachments }: AttachmentPairCardsProps) {
  const pairs = groupPairedAttachments(attachments);

  if (pairs.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>

      {pairs.map((pair) => (
        <>
          {pair.audio ? (
            <AudioPlayer
              className={styles.audioPlayer}
              src={pair.audio.url}
              preload="metadata"
              showDownloadProgress={false}
              showJumpControls={false}
              showFilledVolume
              autoPlayAfterSrcChange={false}
              i18nAriaLabels={{
                player: 'Аудиоплеер',
                progressControl: 'Управление воспроизведением',
                volumeControl: 'Регулятор громкости',
                play: 'Воспроизвести',
                pause: 'Пауза',
                loop: 'Включить зацикливание',
                loopOff: 'Выключить зацикливание',
                volume: 'Включить звук',
                volumeMute: 'Выключить звук',
              }}
              footer={
                pair.pdf ? (
                  <a
                    className={styles.pdfLink}
                    href={pair.pdf.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Открыть PDF
                  </a>
                ) : undefined
              }
            >
              Ваш браузер не поддерживает воспроизведение аудио.
            </AudioPlayer>
          ) : (
            <p className={styles.missing}>Аудио в комплекте отсутствует.</p>
          )}
        </>
      ))}
    </div>
  );
}
