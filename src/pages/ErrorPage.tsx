// LIBRARIES
import { useNavigate, useRouteError } from 'react-router';
// COMPONENTS
import { Button, Panel } from '@components';
// STYLES
import styles from '@styles/pages/error-page.module.scss';

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }

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

export const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.wrapper}>
      <Panel className={styles.panel}>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.message}>{getErrorMessage(error)}</p>
        <Button size="lg" fullWidth onClick={handleBack}>
          Back to menu
        </Button>
      </Panel>
    </div>
  );
};
