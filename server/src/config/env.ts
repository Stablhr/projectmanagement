import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongodbUri:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/trello-clone',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  devAuth: process.env.DEV_AUTH === 'true',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function isFirebaseConfigured() {
  return Boolean(env.firebaseProjectId || env.firebaseServiceAccountJson);
}

export function isDev() {
  return env.nodeEnv === 'development';
}
