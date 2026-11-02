// HOOKS
import { useClipboard } from '@hooks';
// STYLES
import styles from '@styles/components/ui/room-code.module.scss';

type TRoomCodeProps = {
  code: string;
};

export const RoomCode = ({ code }: TRoomCodeProps) => {
  const { copied, copy } = useClipboard();

  const handleCopy = () => {
    copy(code);
  };

  return (
    <button type="button" className={styles.roomCode} onClick={handleCopy} title="Copy room code">
      <code className={styles.code}>{code}</code>
      <span className={copied ? styles.copied : styles.action}>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};
