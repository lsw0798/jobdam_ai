import {
  readStorageValue,
  resolveBrowserStorage,
  writeStorageValue,
} from '../../lib/browserStorage';

export const RESUME_STORAGE_KEY = 'jobdam-ai:resume';

export function getResumeStorageKey(userId) {
  return userId
    ? `${RESUME_STORAGE_KEY}:${encodeURIComponent(String(userId))}`
    : RESUME_STORAGE_KEY;
}

export function createResumeService(storage = resolveBrowserStorage(), userId) {
  const storageKey = getResumeStorageKey(userId);

  return {
    load() {
      const savedResume = readStorageValue(storage, storageKey);

      if (!savedResume) {
        return null;
      }

      try {
        return JSON.parse(savedResume);
      } catch {
        return null;
      }
    },
    save(resume) {
      writeStorageValue(storage, storageKey, JSON.stringify(resume));
      return resume;
    },
  };
}

export const resumeService = createResumeService();
