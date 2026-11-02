// LIBRARIES
import { initializeApp } from 'firebase/app';
import {
  browserSessionPersistence,
  connectAuthEmulator,
  initializeAuth,
  signInAnonymously,
  signOut,
  type User,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
// CONSTANTS
import { EMULATOR_PROJECT_ID, FIREBASE_CONFIG } from '@constants';

export const isEmulatorMode = import.meta.env.MODE === 'emulators';

const EMULATOR_CONFIG = {
  ...FIREBASE_CONFIG,
  projectId: EMULATOR_PROJECT_ID,
  databaseURL: `https://${EMULATOR_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

export const app = initializeApp(isEmulatorMode ? EMULATOR_CONFIG : FIREBASE_CONFIG);

export const db = getFirestore(app);

export const auth = initializeAuth(app, { persistence: browserSessionPersistence });

if (isEmulatorMode) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

const TAB_CHECK_TIMEOUT = 150;

type TIdentityMessage = { type: 'who-has' | 'taken'; uid: string };

const identityChannel = new BroadcastChannel('quoridor-identity');
let confirmedUid: string | null = null;
let signInPromise: Promise<User> | null = null;

identityChannel.addEventListener('message', (event: MessageEvent<TIdentityMessage>) => {
  if (event.data.type === 'who-has' && event.data.uid === confirmedUid) {
    identityChannel.postMessage({ type: 'taken', uid: confirmedUid } satisfies TIdentityMessage);
  }
});

const isUsedByAnotherTab = (uid: string) => {
  return new Promise<boolean>((resolve) => {
    const handleMessage = (event: MessageEvent<TIdentityMessage>) => {
      if (event.data.type === 'taken' && event.data.uid === uid) finish(true);
    };

    const finish = (result: boolean) => {
      identityChannel.removeEventListener('message', handleMessage);
      window.clearTimeout(timeout);
      resolve(result);
    };

    const timeout = window.setTimeout(() => finish(false), TAB_CHECK_TIMEOUT);

    identityChannel.addEventListener('message', handleMessage);
    identityChannel.postMessage({ type: 'who-has', uid } satisfies TIdentityMessage);
  });
};

const signIn = async () => {
  await auth.authStateReady();

  const currentUser = auth.currentUser;

  if (currentUser && !(await isUsedByAnotherTab(currentUser.uid))) {
    confirmedUid = currentUser.uid;
    return currentUser;
  }

  if (currentUser) {
    await signOut(auth);
  }

  const { user } = await signInAnonymously(auth);
  confirmedUid = user.uid;
  return user;
};

export const ensureSignedIn = () => {
  signInPromise ??= signIn().catch((error) => {
    signInPromise = null;
    throw error;
  });

  return signInPromise;
};
