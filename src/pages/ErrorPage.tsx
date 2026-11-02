// LIBRARIES
import { useRouteError } from 'react-router';
// STYLES
import styles from '@styles/pages/error-page.module.scss';

export const ErrorPage = () => {
  const error = useRouteError();

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return String(error.message);
    }

    if (typeof error === 'object' && error !== null) {
      if ('data' in error) {
        return String(error.data);
      }

      if ('message' in error) {
        return String(error.message);
      }

      if ('statusText' in error) {
        return String(error.statusText);
      }
    }

    return JSON.stringify(error, null, 2);
  };

  return <pre className={styles.error}>{getErrorMessage(error)}</pre>;
};
