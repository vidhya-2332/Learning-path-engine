import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { OverviewPage } from '@/pages/app/OverviewPage';
import { IntelligencePage } from '@/pages/app/IntelligencePage';
import { RecommendationsPage } from '@/pages/app/RecommendationsPage';
import { LearningPathPage } from '@/pages/app/LearningPathPage';
import { ProgressPage } from '@/pages/app/ProgressPage';
import { ProfileSetupPage } from '@/pages/app/ProfileSetupPage';
import { AssessmentPage } from '@/pages/app/AssessmentPage';
import { Spinner } from '@/components/ui/States';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="profile" element={<ProfileSetupPage />} />
        <Route path="assessment" element={<AssessmentPage />} />
        <Route path="intelligence" element={<IntelligencePage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="path" element={<LearningPathPage />} />
        <Route path="progress" element={<ProgressPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
