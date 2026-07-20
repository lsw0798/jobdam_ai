const SESSION_COOKIE = 'jobdam_session';

export function createSessionMiddleware(repository) {
  return (request, _response, next) => {
    request.user = repository.getUserForSession(request.cookies[SESSION_COOKIE]);
    next();
  };
}

export function requireAuth(request, response, next) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: '로그인이 필요합니다.',
      },
    });
  }

  return next();
}

export function setSessionCookie(response, sessionId, isProduction) {
  response.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: isProduction,
  });
}

export function clearSessionCookie(response, isProduction) {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  });
}
