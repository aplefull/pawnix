// LIBRARIES
import { type ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router';
// COMPONENTS
import { Spinner, TextInput } from '@components';
// CONSTANTS
import { ROOM_CODE_LENGTH } from '@constants';
// UTILS
import { getSeatOf, isRoomCode, isRoomFull, logger, normalizeRoomCode } from '@utils';
// SERVICES
import { ensureSignedIn, fetchRoom } from '@services';
// STYLES
import styles from '@styles/components/menu.module.scss';

type TJoinRoomProps = {
  label?: string;
  autoFocus?: boolean;
  disabled?: boolean;
};

export const JoinRoom = ({ label = 'Room code', autoFocus = false, disabled = false }: TJoinRoomProps) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const roomId = normalizeRoomCode(e.target.value);
    setError(null);

    if (!isRoomCode(roomId)) return;

    setLoading(true);

    try {
      const user = await ensureSignedIn();
      const room = await fetchRoom(roomId);

      if (!room) {
        setError("This room doesn't exist. Check the code and try again.");
        return;
      }

      if (isRoomFull(room.players) && !getSeatOf(room.players, user.uid)) {
        setError('This room is full.');
        return;
      }

      navigate(`/play/${roomId}`);
    } catch (err) {
      logger.error(err);
      setError("Couldn't join this room. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <TextInput
        label={label}
        placeholder={disabled ? 'Enter your name first' : 'Enter the room code'}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={ROOM_CODE_LENGTH}
        className={styles.codeInput}
        autoFocus={autoFocus}
        onChange={handleCodeInput}
        disabled={disabled || loading}
        error={error}
      />
      {loading && (
        <div className={styles.waiting}>
          <Spinner size="sm" />
          <span>Joining room...</span>
        </div>
      )}
    </div>
  );
};
