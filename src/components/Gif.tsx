// LIBRARIES
import { memo, useMemo, useState } from 'react';
// UTILS
import { getRandomGif } from '@utils';
// COMPONENTS
import { Spinner } from '@components';
// STYLES
import styles from '@styles/components/gif.module.scss';

type TGifProps = {
  isWinner: boolean;
};

export const Gif = memo(({ isWinner }: TGifProps) => {
  const [loading, setLoading] = useState(true);

  const altText = isWinner ? 'You won!' : 'You lost!';
  const src = useMemo(() => getRandomGif(isWinner), [isWinner]);

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className={styles.frame}>
      <img className={loading ? styles.hidden : styles.image} onLoad={handleLoad} src={src} alt={altText} />
      {loading && <Spinner />}
    </div>
  );
});
