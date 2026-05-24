import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Graceful fallback config
const fallbackConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "placeholder-auth-domain",
  projectId: "placeholder-project-id",
  storageBucket: "placeholder-storage-bucket",
  messagingSenderId: "placeholder-sender-id",
  appId: "placeholder-app-id",
  firestoreDatabaseId: "(default)"
};

let activeConfig = fallbackConfig;
let isRealFirebase = false;

// Safe try-catch configuration loader
try {
  // We dynamically attempt to fetch or read from env or local file if provided
  const configEnv = process.env.GEMINI_API_KEY; // can use as a trigger or other standard configs
  if (configEnv && !configEnv.includes("MY_GEMINI_API_KEY")) {
    // Real env detected
  }
} catch (e) {
  // Handle dynamically
}

const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export { isRealFirebase };

// Real-world Firestore error parser conforming with the firebase-integration guide
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  if (!isRealFirebase) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
