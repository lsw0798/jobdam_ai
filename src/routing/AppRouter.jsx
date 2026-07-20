import { useContext, useEffect, useMemo, useState } from 'react';
import { HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AuthContext } from '../features/auth/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { CareerAnalysisPage } from '../features/career/CareerAnalysisPage';
import { CareerDecisionPage } from '../features/career/CareerDecisionPage';
import { ComingSoonPage } from '../features/common/ComingSoonPage';
import { CoverLetterHubPage } from '../features/coverLetters/CoverLetterHubPage';
import { OtherItemGuidePage } from '../features/coverLetters/OtherItemGuidePage';
import { CoverLetterLibraryPage } from '../features/coverLetters/library/CoverLetterLibraryPage';
import { createCoverLetterLibraryService } from '../features/coverLetters/library/coverLetterLibraryService';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ExperienceEditorPage } from '../features/experience/ExperienceEditorPage';
import { ExperiencePage } from '../features/experience/ExperiencePage';
import { createExperienceService } from '../features/experience/experienceService';
import { InterviewExamplesPage } from '../features/interview/InterviewExamplesPage';
import { InterviewWorkspacePage } from '../features/interview/workspace/InterviewWorkspacePage';
import { createInterviewWorkspaceService } from '../features/interview/workspace/interviewWorkspaceService';
import { markFeatureCompleted, readProgress } from '../features/progress/progressService';
import { ResumePage } from '../features/resume/ResumePage';
import { createResumeService } from '../features/resume/resumeService';
import { SpeechPage } from '../features/speech/SpeechPage';
import { SuccessExamplesPage } from '../features/successExamples/SuccessExamplesPage';
import { SuccessExamplesWorkspacePage } from '../features/successExamples/workspace/SuccessExamplesWorkspacePage';
import { createSuccessExamplesWorkspaceService } from '../features/successExamples/workspace/successExamplesWorkspaceService';
import { CareerInformationPage } from '../features/videos/CareerInformationPage';
import { CareerVideoLibraryPage } from '../features/videos/library/CareerVideoLibraryPage';
import { ROUTES } from './routes';

const PREVIEW_USER = Object.freeze({
  id: 'preview-user',
  name: '데모 사용자',
  email: 'demo@jobdam.local',
});

function ProtectedPage({ authenticated, children, onLogout, progress, user }) {
  if (!authenticated) {
    return <Navigate replace to={ROUTES.login} />;
  }

  return (
    <AppShell onLogout={onLogout} progress={progress} user={user}>
      {children}
    </AppShell>
  );
}

function AuthOnlyPage({ authenticated, children }) {
  return authenticated ? <Navigate replace to={ROUTES.dashboard} /> : children;
}

export function AppRouter({ authenticated: authenticatedOverride, initialPath }) {
  const auth = useContext(AuthContext);
  const authenticated = authenticatedOverride ?? auth?.isAuthenticated ?? false;
  const user = auth?.user ?? (authenticated ? PREVIEW_USER : null);
  const storageOwnerId = user?.id ?? PREVIEW_USER.id;
  const experienceService = useMemo(
    () => createExperienceService(undefined, undefined, storageOwnerId),
    [storageOwnerId],
  );
  const resumeService = useMemo(
    () => createResumeService(undefined, storageOwnerId),
    [storageOwnerId],
  );
  const coverLetterService = useMemo(
    () => createCoverLetterLibraryService(undefined, storageOwnerId),
    [storageOwnerId],
  );
  const successExamplesService = useMemo(
    () => createSuccessExamplesWorkspaceService(undefined, storageOwnerId),
    [storageOwnerId],
  );
  const interviewService = useMemo(
    () => createInterviewWorkspaceService(undefined, storageOwnerId),
    [storageOwnerId],
  );
  const [progress, setProgress] = useState(() => (
    authenticated ? readProgress(user?.id ?? PREVIEW_USER.id) : {}
  ));
  const Router = initialPath ? MemoryRouter : HashRouter;
  const routerProps = initialPath ? { initialEntries: [initialPath] } : {};

  useEffect(() => {
    setProgress(authenticated ? readProgress(user?.id ?? PREVIEW_USER.id) : {});
  }, [authenticated, user?.id]);

  function handleFeatureSaved(featureId) {
    const progressOwnerId = user?.id ?? PREVIEW_USER.id;
    setProgress(markFeatureCompleted(progressOwnerId, featureId));
  }

  function handleLogout() {
    auth?.signOut?.();
  }

  function protectedElement(children) {
    return (
      <ProtectedPage
        authenticated={authenticated}
        onLogout={handleLogout}
        progress={progress}
        user={user}
      >
        {children}
      </ProtectedPage>
    );
  }

  return (
    <Router {...routerProps}>
      <Routes>
        <Route
          element={<AuthOnlyPage authenticated={authenticated}><LoginPage /></AuthOnlyPage>}
          path={ROUTES.login}
        />
        <Route
          element={<AuthOnlyPage authenticated={authenticated}><SignupPage /></AuthOnlyPage>}
          path={ROUTES.signup}
        />
        <Route element={protectedElement(<DashboardPage progress={progress} />)} path={ROUTES.dashboard} />
        <Route element={protectedElement(<ExperiencePage />)} path={ROUTES.experience} />
        <Route
          element={protectedElement(
            <ExperienceEditorPage
              onSaved={() => handleFeatureSaved('experience')}
              service={experienceService}
            />,
          )}
          path={ROUTES.experienceWrite}
        />
        <Route element={protectedElement(<CareerDecisionPage />)} path={ROUTES.careerDecision} />
        <Route element={protectedElement(<CareerAnalysisPage />)} path={ROUTES.careerAnalysis} />
        <Route
          element={protectedElement(
            <ResumePage onSaved={() => handleFeatureSaved('resume')} service={resumeService} />,
          )}
          path={ROUTES.resume}
        />
        <Route element={protectedElement(<CoverLetterHubPage />)} path={ROUTES.coverLetters} />
        <Route element={protectedElement(<OtherItemGuidePage />)} path={ROUTES.coverLetterOther} />
        <Route
          element={protectedElement(
            <CoverLetterLibraryPage
              onSaved={() => handleFeatureSaved('coverLetterLibrary')}
              service={coverLetterService}
            />,
          )}
          path={ROUTES.coverLetterLibrary}
        />
        <Route element={protectedElement(<SuccessExamplesPage />)} path={ROUTES.successExamples} />
        <Route
          element={protectedElement(
            <SuccessExamplesWorkspacePage
              onSaved={() => handleFeatureSaved('successExamples')}
              service={successExamplesService}
            />,
          )}
          path={ROUTES.successExamplesWorkspace}
        />
        <Route element={protectedElement(<SpeechPage />)} path={ROUTES.speech} />
        <Route element={protectedElement(<InterviewExamplesPage />)} path={ROUTES.interviewExamples} />
        <Route
          element={protectedElement(
            <InterviewWorkspacePage
              onSaved={() => handleFeatureSaved('interviewExamples')}
              service={interviewService}
            />,
          )}
          path={ROUTES.interviewWorkspace}
        />
        <Route element={protectedElement(<CareerInformationPage />)} path={ROUTES.careerInformation} />
        <Route
          element={protectedElement(<CareerVideoLibraryPage />)}
          path={ROUTES.careerInformationLibrary}
        />
        <Route element={protectedElement(<ComingSoonPage />)} path="/coming-soon/:featureId" />
        <Route
          element={<Navigate replace to={authenticated ? ROUTES.dashboard : ROUTES.login} />}
          path="*"
        />
      </Routes>
    </Router>
  );
}
