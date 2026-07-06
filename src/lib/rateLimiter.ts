const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const STORAGE_PREFIX = 'sla_login_';

interface IAttemptRecord {
  count: number;
  blockedUntil: number | null;
}

const getRecord = (email: string): IAttemptRecord => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${email}`);
    if (!raw) return { count: 0, blockedUntil: null };
    return JSON.parse(raw) as IAttemptRecord;
  } catch {
    return { count: 0, blockedUntil: null };
  }
};

const saveRecord = (email: string, record: IAttemptRecord): void => {
  localStorage.setItem(`${STORAGE_PREFIX}${email}`, JSON.stringify(record));
};

export const checkRateLimit = (email: string): { blocked: boolean; minutesLeft: number } => {
  const record = getRecord(email);

  if (record.blockedUntil !== null) {
    if (Date.now() < record.blockedUntil) {
      const minutesLeft = Math.ceil((record.blockedUntil - Date.now()) / 60000);
      return { blocked: true, minutesLeft };
    }
    saveRecord(email, { count: 0, blockedUntil: null });
  }

  return { blocked: false, minutesLeft: 0 };
};

export const recordFailedAttempt = (email: string): { blocked: boolean; minutesLeft: number } => {
  const record = getRecord(email);
  const newCount = record.count + 1;

  if (newCount >= MAX_ATTEMPTS) {
    const blockedUntil = Date.now() + BLOCK_DURATION_MS;
    saveRecord(email, { count: newCount, blockedUntil });
    return { blocked: true, minutesLeft: 15 };
  }

  saveRecord(email, { count: newCount, blockedUntil: null });
  return { blocked: false, minutesLeft: 0 };
};

export const clearLoginAttempts = (email: string): void => {
  localStorage.removeItem(`${STORAGE_PREFIX}${email}`);
};
