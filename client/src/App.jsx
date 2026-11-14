import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

// Pages
import { LandingPage } from './pages/auth/LandingPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { DashboardPage } from './pages/dashboard/DashboardPage.jsx';
import { ProjectListPage } from './pages/projects/ProjectListPage.jsx';
import { CreateProjectPage } from './pages/projects/CreateProjectPage.jsx';
import { ProjectDetailsPage } from './pages/projects/ProjectDetailsPage.jsx';
import { ReportsPage } from './pages/reports/ReportsPage.jsx';
import { ProfilePage } from './pages/settings/ProfilePage.jsx';
import { SettingsPage } from './pages/settings/SettingsPage.jsx';
import { NotFoundPage } from './pages/notfound/NotFoundPage.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Application Workspace */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/new" element={<CreateProjectPage />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/projects/:id/:tab" element={<ProjectDetailsPage />} />
              <Route path="/projects/:id/reports" element={<ReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
