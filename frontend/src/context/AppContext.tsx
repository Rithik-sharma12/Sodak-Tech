import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UserProfile, Problem, Submission, UserSetting, Role } from '../types';
import { INITIAL_USER, DEFAULT_SETTINGS } from '../data/mockData';
import { api, ApiError, toUserProfile } from '../api';

/**
 * Application state, backed by the Django API.
 *
 * `INITIAL_USER` and `DEFAULT_SETTINGS` are still imported, but only as
 * *shapes* — the profile the API returns is merged onto INITIAL_USER so fields
 * the backend does not model yet (topic mastery, activity heatmap) stay
 * structurally present rather than undefined. No mock problems or submissions
 * are used anywhere; those come from the server, or the list is empty.
 *
 * An empty platform is the expected first state on a fresh install, so views
 * must render nothing gracefully rather than be handed fabricated rows.
 */

interface AppContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  role: Role;
  setRole: (role: Role) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;

  // Auth against the real session.
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  authPending: boolean;

  // True until the initial session check resolves. Views must not decide
  // "signed out" before this settles, or every reload flashes the login screen.
  bootstrapping: boolean;

  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProblemId: string | null;
  setSelectedProblemId: (id: string | null) => void;
  selectedSubmissionId: string | null;
  setSelectedSubmissionId: (id: string | null) => void;
  selectedContestId: string | null;
  setSelectedContestId: (id: string | null) => void;

  problems: Problem[];
  problemsLoading: boolean;
  refreshProblems: () => Promise<void>;
  addProblem: (p: Problem) => void;
  updateProblem: (p: Problem) => void;
  deleteProblem: (id: string) => void;

  submissions: Submission[];
  addSubmission: (sub: Submission) => void;
  refreshSubmissions: () => Promise<void>;
  /** Run (sample groups only) or Submit (all groups). Returns the judged row. */
  submitCode: (
    problemSlug: string,
    language: string,
    sourceCode: string,
    kind: 'run' | 'submit',
  ) => Promise<Submission>;

  solvedProblemIds: string[];
  bookmarks: string[];
  toggleBookmark: (problemId: string) => void;
  settings: UserSetting;
  updateSettings: (newSettings: Partial<UserSetting>) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  editProfileModalOpen: boolean;
  setEditProfileModalOpen: (open: boolean) => void;
  navigateToProblem: (id: string) => void;
  navigateToSubmission: (id: string) => void;
  navigateToContest: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [role, setRoleState] = useState<Role>('Student');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState<boolean>(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSetting>(DEFAULT_SETTINGS);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState<boolean>(false);

  // ------------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------------

  const refreshProblems = useCallback(async () => {
    setProblemsLoading(true);
    try {
      setProblems(await api.problems.list());
    } catch {
      // A failed fetch leaves the list empty rather than stale or invented.
      setProblems([]);
    } finally {
      setProblemsLoading(false);
    }
  }, []);

  const refreshSubmissions = useCallback(async () => {
    try {
      setSubmissions(await api.submissions.list());
    } catch {
      setSubmissions([]);
    }
  }, []);

  const applyUser = useCallback((profile: UserProfile) => {
    setUser(profile);
    setRoleState(profile.role);
    setIsLoggedIn(true);
  }, []);

  // Resolve any existing session on load. A 403 simply means signed out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.auth.me();
        if (cancelled) return;
        applyUser(toUserProfile(me as unknown as Record<string, unknown>, INITIAL_USER));
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  // Problems are public, so load them regardless of session state.
  useEffect(() => {
    refreshProblems();
  }, [refreshProblems]);

  // Submissions are per-user, so only once signed in.
  useEffect(() => {
    if (isLoggedIn) refreshSubmissions();
    else setSubmissions([]);
  }, [isLoggedIn, refreshSubmissions]);

  // ------------------------------------------------------------------
  // Auth
  // ------------------------------------------------------------------

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthPending(true);
      setAuthError(null);
      try {
        const me = await api.auth.login(email, password);
        applyUser(toUserProfile(me as unknown as Record<string, unknown>, INITIAL_USER));
        setActiveTab('dashboard');
      } catch (error) {
        setAuthError(
          error instanceof ApiError && (error.status === 400 || error.status === 401)
            ? 'Incorrect email or password.'
            : (error as Error).message,
        );
        throw error;
      } finally {
        setAuthPending(false);
      }
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      // Clear locally even if the request failed — the user asked to leave.
      setIsLoggedIn(false);
      setUser(INITIAL_USER);
      setRoleState('Student');
      setSubmissions([]);
      setActiveTab('auth');
    }
  }, []);

  // Rendering only. The server re-checks the role on every privileged request.
  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  // ------------------------------------------------------------------
  // Derived
  // ------------------------------------------------------------------

  const solvedProblemIds = submissions
    .filter((s) => s.verdict === 'Accepted')
    .map((s) => s.problemId);

  // ------------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------------

  const submitCode = useCallback(
    async (problemSlug: string, language: string, sourceCode: string, kind: 'run' | 'submit') => {
      const result = await api.submissions.create({ problemSlug, language, sourceCode, kind });
      // A Run is diagnostic and does not belong in submission history.
      if (kind === 'submit') {
        setSubmissions((prev) => [result, ...prev]);
        refreshProblems();
      }
      return result;
    },
    [refreshProblems],
  );

  const addProblem = (p: Problem) => setProblems((prev) => [p, ...prev]);
  const updateProblem = (p: Problem) =>
    setProblems((prev) => prev.map((item) => (item.id === p.id ? p : item)));
  const deleteProblem = (id: string) => setProblems((prev) => prev.filter((p) => p.id !== id));
  const addSubmission = (sub: Submission) => setSubmissions((prev) => [sub, ...prev]);

  const toggleBookmark = (problemId: string) =>
    setBookmarks((prev) =>
      prev.includes(problemId) ? prev.filter((id) => id !== problemId) : [...prev, problemId],
    );

  const updateSettings = (newSettings: Partial<UserSetting>) =>
    setSettings((prev) => ({ ...prev, ...newSettings }));

  // ------------------------------------------------------------------
  // Theme — light default, persisted
  // ------------------------------------------------------------------

  const theme = settings.theme || 'light';

  useEffect(() => {
    const stored = localStorage.getItem('sodak.theme') as 'light' | 'dark' | null;
    if (stored) setSettings((prev) => ({ ...prev, theme: stored }));
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('sodak.theme', next);
    setSettings((prev) => ({ ...prev, theme: next }));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    localStorage.setItem('sodak.theme', newTheme);
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    // Also expose it as an attribute so CSS can key off either.
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  const navigateToProblem = (id: string) => {
    setSelectedProblemId(id);
    setActiveTab('problem-detail');
  };

  const navigateToSubmission = (id: string) => {
    setSelectedSubmissionId(id);
    setActiveTab('submission-detail');
  };

  const navigateToContest = (id: string) => {
    setSelectedContestId(id);
    setActiveTab('contest-detail');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        role,
        setRole,
        isLoggedIn,
        setIsLoggedIn,
        login,
        logout,
        authError,
        authPending,
        bootstrapping,
        activeTab,
        setActiveTab,
        selectedProblemId,
        setSelectedProblemId,
        selectedSubmissionId,
        setSelectedSubmissionId,
        selectedContestId,
        setSelectedContestId,
        problems,
        problemsLoading,
        refreshProblems,
        addProblem,
        updateProblem,
        deleteProblem,
        submissions,
        addSubmission,
        refreshSubmissions,
        submitCode,
        solvedProblemIds,
        bookmarks,
        toggleBookmark,
        settings,
        updateSettings,
        theme,
        toggleTheme,
        setTheme,
        searchModalOpen,
        setSearchModalOpen,
        editProfileModalOpen,
        setEditProfileModalOpen,
        navigateToProblem,
        navigateToSubmission,
        navigateToContest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
