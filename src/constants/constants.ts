export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDVQdMWVjV5taAPUp27i6btz9ag1cHpVr8',
  authDomain: 'quoridor-game-c684f.firebaseapp.com',
  databaseURL: 'https://quoridor-game-c684f-default-rtdb.firebaseio.com',
  projectId: 'quoridor-game-c684f',
  storageBucket: 'quoridor-game-c684f.appspot.com',
  messagingSenderId: '1020112765303',
  appId: '1:1020112765303:web:d575477aa29fe6d040a172',
};

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const ROOM_CODE_LENGTH = 6;

export const ROOM_CODE_ATTEMPTS = 5;

export const ROOM_TTL_DAYS = 7;

export const MENU_STATES = {
  INITIAL: 'INITIAL',
  SELECT_PLAYER: 'SELECT_PLAYER',
  JOIN_ROOM: 'JOIN_ROOM',
} as const;
