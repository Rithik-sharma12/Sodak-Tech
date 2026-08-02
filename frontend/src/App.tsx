import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { EditProfileModal } from './components/EditProfileModal';

import { DashboardView } from './components/views/DashboardView';
import { ProblemsListView } from './components/views/ProblemsListView';
import { ProblemWorkspaceView } from './components/views/ProblemWorkspaceView';
import { SubmissionDetailView } from './components/views/SubmissionDetailView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { ContestsView } from './components/views/ContestsView';
import { ContestWorkspaceView } from './components/views/ContestWorkspaceView';
import { ProfileView } from './components/views/ProfileView';
import { AuthView } from './components/views/AuthView';
import { SettingsView } from './components/views/SettingsView';
import { AdminOverviewView } from './components/views/AdminOverviewView';
import { AdminProblemEditorView } from './components/views/AdminProblemEditorView';
import { AdminUsersView } from './components/views/AdminUsersView';

const MainContent: React.FC = () => {
  const { activeTab, theme, isLoggedIn, bootstrapping } = useApp();

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'problems':
        return <ProblemsListView />;
      case 'problem-detail':
        return <ProblemWorkspaceView />;
      case 'submission-detail':
        return <SubmissionDetailView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'contests':
        return <ContestsView />;
      case 'contest-detail':
        return <ContestWorkspaceView />;
      case 'profile':
        return <ProfileView />;
      case 'auth':
        return <AuthView />;
      case 'settings':
        return <SettingsView />;
      case 'admin-overview':
        return <AdminOverviewView />;
      case 'admin-new-problem':
        return <AdminProblemEditorView />;
      case 'admin-users':
        return <AdminUsersView />;
      default:
        return <DashboardView />;
    }
  };

  // The problem detail workspace has its own IDE layout bar
  const isFullWidthIDE = activeTab === 'problem-detail';

  // Hold the frame until the session check resolves. Rendering the sign-in
  // screen first and then swapping to the dashboard makes every reload flash.
  if (bootstrapping) {
    return (
      <div
        className={`min-h-screen grid place-items-center ${
          theme === 'dark' ? 'bg-zinc-950' : 'bg-slate-100'
        }`}
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  // Signed out: the only reachable screen is sign-in. This is convenience, not
  // security — every protected endpoint re-checks the session server-side.
  if (!isLoggedIn) {
    return (
      <div
        className={
          theme === 'dark'
            ? 'min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased'
            : 'min-h-screen bg-slate-100 text-slate-900 font-sans antialiased'
        }
      >
        <AuthView />
      </div>
    );
  }

  return (
    <div
      className={`${isFullWidthIDE ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col font-sans antialiased ${
        theme === 'dark'
          ? 'bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white'
          : 'bg-slate-100 text-slate-900 selection:bg-blue-500 selection:text-white'
      }`}
    >
      <Header />
      
      <main
        className={
          isFullWidthIDE
            ? 'pane flex-1 overflow-hidden'
            : 'pane flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10'
        }
      >
        {renderView()}
      </main>

      {!isFullWidthIDE && <Footer />}

      <SearchModal />
      <EditProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
