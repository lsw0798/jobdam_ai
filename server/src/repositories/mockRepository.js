import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

export const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function createMockRepository({
  now = () => Date.now(),
  sessionTtlMs = DEFAULT_SESSION_TTL_MS,
} = {}) {
  const usersByEmail = new Map();
  const usersById = new Map();
  const sessions = new Map();
  const experiences = new Map();
  const coverLetters = new Map();
  const successExampleWorkspaces = new Map();
  const interviewWorkspaces = new Map();

  function clone(value) {
    return value == null ? value : structuredClone(value);
  }

  function withDocumentTimestamps(document, existingDocument = null) {
    const timestamp = new Date(now()).toISOString();
    return {
      ...document,
      createdAt: existingDocument?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
  }

  function getOwnerCoverLetters(userId) {
    if (!coverLetters.has(userId)) {
      coverLetters.set(userId, new Map());
    }

    return coverLetters.get(userId);
  }

  return {
    async createUser({ email, name, password }) {
      const normalizedEmail = email.toLowerCase();

      if (usersByEmail.has(normalizedEmail)) {
        return null;
      }

      const user = {
        id: randomUUID(),
        name,
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
      };

      if (usersByEmail.has(normalizedEmail)) {
        return null;
      }

      usersByEmail.set(normalizedEmail, user);
      usersById.set(user.id, user);
      return publicUser(user);
    },

    async verifyCredentials({ email, password }) {
      const user = usersByEmail.get(email.toLowerCase());

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return null;
      }

      return publicUser(user);
    },

    createSession(userId) {
      const sessionId = randomUUID();
      sessions.set(sessionId, {
        expiresAt: now() + sessionTtlMs,
        userId,
      });
      return sessionId;
    },

    deleteSession(sessionId) {
      sessions.delete(sessionId);
    },

    getUserForSession(sessionId) {
      const session = sessions.get(sessionId);

      if (!session || session.expiresAt <= now()) {
        if (session) sessions.delete(sessionId);
        return null;
      }

      const user = usersById.get(session.userId);
      return user ? publicUser(user) : null;
    },

    getExperience(userId) {
      return clone(experiences.get(userId) ?? null);
    },

    saveExperience(userId, document) {
      const savedDocument = withDocumentTimestamps(document, experiences.get(userId));

      experiences.set(userId, clone(savedDocument));
      return clone(savedDocument);
    },

    listCoverLetters(userId) {
      return [...getOwnerCoverLetters(userId).values()].map(clone);
    },

    getCoverLetter(userId, masterCd) {
      return clone(getOwnerCoverLetters(userId).get(String(masterCd)) ?? null);
    },

    saveCoverLetter(userId, document) {
      const ownerCoverLetters = getOwnerCoverLetters(userId);
      const documentId = String(document.masterCd);
      const savedDocument = withDocumentTimestamps(document, ownerCoverLetters.get(documentId));

      ownerCoverLetters.set(documentId, clone(savedDocument));
      return clone(savedDocument);
    },

    deleteCoverLetter(userId, masterCd) {
      return getOwnerCoverLetters(userId).delete(String(masterCd));
    },

    getSuccessExamplesWorkspace(userId) {
      return clone(successExampleWorkspaces.get(userId) ?? null);
    },

    saveSuccessExamplesWorkspace(userId, workspace) {
      const savedWorkspace = withDocumentTimestamps(
        workspace,
        successExampleWorkspaces.get(userId),
      );
      successExampleWorkspaces.set(userId, clone(savedWorkspace));
      return clone(savedWorkspace);
    },

    getInterviewWorkspace(userId) {
      return clone(interviewWorkspaces.get(userId) ?? null);
    },

    saveInterviewWorkspace(userId, workspace) {
      const savedWorkspace = withDocumentTimestamps(workspace, interviewWorkspaces.get(userId));
      interviewWorkspaces.set(userId, clone(savedWorkspace));
      return clone(savedWorkspace);
    },
  };
}
