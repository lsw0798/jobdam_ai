import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { clearSessionCookie, createSessionMiddleware, requireAuth, setSessionCookie } from './middleware/auth.js';
import {
  coverLetterSchema,
  experienceSchema,
  interviewWorkspaceSchema,
  loginSchema,
  signupSchema,
  successExamplesWorkspaceSchema,
} from './schemas.js';

function validationError(response, result) {
  return response.status(422).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: '입력값을 확인하세요.',
      fieldErrors: result.error.flatten().fieldErrors,
    },
  });
}

function readValidBody(schema, request, response) {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    validationError(response, result);
    return null;
  }

  return result.data;
}

export function createApp({ repository, frontendOrigin = 'http://localhost:5173', isProduction = false }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ credentials: true, origin: frontendOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(createSessionMiddleware(repository));

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      storageMode: 'mock-contract',
      contracts: ['experience', 'coverLetters', 'successExamples', 'interview'],
    });
  });

  app.post('/api/auth/signup', async (request, response) => {
    const payload = readValidBody(signupSchema, request, response);
    if (!payload) return;

    const user = await repository.createUser(payload);
    if (!user) {
      return response.status(409).json({
        error: { code: 'EMAIL_IN_USE', message: '이미 사용 중인 이메일입니다.' },
      });
    }

    setSessionCookie(response, repository.createSession(user.id), isProduction);
    return response.status(201).json({ user });
  });

  app.post('/api/auth/login', async (request, response) => {
    const payload = readValidBody(loginSchema, request, response);
    if (!payload) return;

    const user = await repository.verifyCredentials(payload);
    if (!user) {
      return response.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호를 확인하세요.' },
      });
    }

    setSessionCookie(response, repository.createSession(user.id), isProduction);
    return response.json({ user });
  });

  app.get('/api/auth/me', requireAuth, (request, response) => response.json({ user: request.user }));

  app.post('/api/auth/logout', (request, response) => {
    const sessionId = request.cookies.jobdam_session;
    if (sessionId) repository.deleteSession(sessionId);
    clearSessionCookie(response, isProduction);
    return response.status(204).end();
  });

  app.get('/api/experience', requireAuth, (request, response) => {
    return response.json({ document: repository.getExperience(request.user.id) });
  });

  app.put('/api/experience', requireAuth, (request, response) => {
    const payload = readValidBody(experienceSchema, request, response);
    if (!payload) return;

    return response.json({ document: repository.saveExperience(request.user.id, payload) });
  });

  app.get('/api/cover-letters', requireAuth, (request, response) => {
    return response.json({ documents: repository.listCoverLetters(request.user.id) });
  });

  app.post('/api/cover-letters', requireAuth, (request, response) => {
    const payload = readValidBody(coverLetterSchema, request, response);
    if (!payload) return;

    return response.status(201).json({
      document: repository.saveCoverLetter(request.user.id, payload),
    });
  });

  app.get('/api/cover-letters/:masterCd', requireAuth, (request, response) => {
    const document = repository.getCoverLetter(request.user.id, request.params.masterCd);

    if (!document) {
      return response.status(404).json({
        error: { code: 'COVER_LETTER_NOT_FOUND', message: '작성한 자기소개서를 찾을 수 없습니다.' },
      });
    }

    return response.json({ document });
  });

  app.put('/api/cover-letters/:masterCd', requireAuth, (request, response) => {
    const payload = readValidBody(coverLetterSchema, request, response);
    if (!payload) return;

    if (String(payload.masterCd) !== request.params.masterCd) {
      return response.status(422).json({
        error: {
          code: 'IDENTIFIER_MISMATCH',
          message: 'URL과 자기소개서 문서 식별자가 일치해야 합니다.',
        },
      });
    }

    if (!repository.getCoverLetter(request.user.id, request.params.masterCd)) {
      return response.status(404).json({
        error: { code: 'COVER_LETTER_NOT_FOUND', message: '작성한 자기소개서를 찾을 수 없습니다.' },
      });
    }

    return response.json({
      document: repository.saveCoverLetter(request.user.id, payload),
    });
  });

  app.delete('/api/cover-letters/:masterCd', requireAuth, (request, response) => {
    const deleted = repository.deleteCoverLetter(request.user.id, request.params.masterCd);

    if (!deleted) {
      return response.status(404).json({
        error: { code: 'COVER_LETTER_NOT_FOUND', message: '작성한 자기소개서를 찾을 수 없습니다.' },
      });
    }

    return response.status(204).end();
  });

  app.get('/api/success-examples/workspace', requireAuth, (request, response) => {
    return response.json({
      workspace: repository.getSuccessExamplesWorkspace(request.user.id),
    });
  });

  app.put('/api/success-examples/workspace', requireAuth, (request, response) => {
    const payload = readValidBody(successExamplesWorkspaceSchema, request, response);
    if (!payload) return;

    return response.json({
      workspace: repository.saveSuccessExamplesWorkspace(request.user.id, payload),
    });
  });

  app.get('/api/interview/workspace', requireAuth, (request, response) => {
    return response.json({ workspace: repository.getInterviewWorkspace(request.user.id) });
  });

  app.put('/api/interview/workspace', requireAuth, (request, response) => {
    const payload = readValidBody(interviewWorkspaceSchema, request, response);
    if (!payload) return;

    return response.json({
      workspace: repository.saveInterviewWorkspace(request.user.id, payload),
    });
  });

  app.use((_request, response) => response.status(404).json({
    error: { code: 'NOT_FOUND', message: '요청한 API를 찾을 수 없습니다.' },
  }));

  app.use((error, _request, response, _next) => {
    if (response.headersSent) return;
    response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 처리 중 오류가 발생했습니다.' },
    });
  });

  return app;
}
