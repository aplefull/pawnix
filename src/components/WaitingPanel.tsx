// COMPONENTS
import { Panel, RoomCode, Spinner } from '@components';
// STYLES
import styles from '@styles/components/waiting-panel.module.scss';

type TWaitingPanelProps = {
  roomId: string;
};

export const WaitingPanel = ({ roomId }: TWaitingPanelProps) => {
  return (
    <Panel className={styles.panel}>
      <div className={styles.waiting}>
        <Spinner size="sm" />
        <span>Waiting for your opponent to join...</span>
      </div>
      <p className={styles.hint}>Send them this room code:</p>
      <RoomCode code={roomId} />
    </Panel>
  );
};
