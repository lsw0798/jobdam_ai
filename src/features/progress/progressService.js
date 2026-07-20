const FEATURE_IDS = Object.freeze([
  'experience',
  'resume',
  'coverLetterLibrary',
  'successExamples',
  'interviewExamples',
]);

const STORAGE_PREFIX = 'jobdam-ai:progress:v1:';

function createFeatureProgress() {
  return { completed: false, updatedAt: null };
}

export function createInitialProgress() {
  return FEATURE_IDS.reduce((progress, featureId) => {
    progress[featureId] = createFeatureProgress();
    return progress;
  }, {});
}

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

function getDefaultStorage() {
  return globalThis.localStorage;
}

function normalizeProgress(progress) {
  const initialProgress = createInitialProgress();

  return FEATURE_IDS.reduce((normalized, featureId) => {
    const featureProgress = progress?.[featureId];

    normalized[featureId] = {
      completed: featureProgress?.completed === true,
      updatedAt: featureProgress?.updatedAt ?? null,
    };

    return normalized;
  }, initialProgress);
}

export function readProgress(userId, storage = getDefaultStorage()) {
  const serializedProgress = storage.getItem(getStorageKey(userId));

  if (!serializedProgress) {
    return createInitialProgress();
  }

  try {
    return normalizeProgress(JSON.parse(serializedProgress));
  } catch {
    return createInitialProgress();
  }
}

export function markFeatureCompleted(userId, featureId, storage = getDefaultStorage()) {
  if (!FEATURE_IDS.includes(featureId)) {
    throw new Error(`Unsupported progress feature: ${featureId}`);
  }

  const progress = readProgress(userId, storage);
  const nextProgress = {
    ...progress,
    [featureId]: {
      completed: true,
      updatedAt: new Date().toISOString(),
    },
  };

  storage.setItem(getStorageKey(userId), JSON.stringify(nextProgress));
  return nextProgress;
}
