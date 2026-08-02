/**
 * Re-authentication gate for destructive admin actions.
 *
 * §8.3 of the design doc makes role changes, account deactivation, problem
 * deletion and test-data replacement require a recent re-auth, enforced
 * server-side by `HasRecentReauth` with a window of REAUTH_WINDOW_SECONDS.
 * This provider gives the UI the matching prompt: when one of those mutations
 * is rejected with the exact "Re-authentication required" message, we ask for
 * the password again, POST it to /auth/reauth/ (which refreshes
 * last_reauth_at), and let the caller retry.
 *
 * Only the specific message triggers the prompt. A 403 for any other reason
 * (own-role change, missing permission) surfaces to the caller as-is — this is
 * not a generic retry-on-403 loop.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ApiError, api } from "./api/client";
import { ReauthDialog } from "../components/reauth-dialog";

/** Mirrors `HasRecentReauth.message` in backend/apps/accounts/permissions.py. */
export const REAUTH_REQUIRED_MESSAGE = "Re-authentication required for this action.";

export function isReauthRequired(error: unknown): boolean {
  return error instanceof ApiError && error.message === REAUTH_REQUIRED_MESSAGE;
}

interface ReauthContextValue {
  /**
   * Opens the re-auth prompt. Resolves once the user has successfully
   * re-authenticated; rejects if they cancel.
   */
  requestReauth: () => Promise<void>;
}

const ReauthContext = createContext<ReauthContextValue | null>(null);

/**
 * Retry `fn` once if the server demands a recent re-auth.
 *
 * The reauth prompt is modal, so exactly one mutation runs it at a time; a
 * second concurrent caller waits on the same in-flight prompt via the shared
 * promise in `pendingRef`.
 */
export function useGuardedReauth(): {
  attempt: <T>(fn: () => Promise<T>) => Promise<T>;
} {
  const { requestReauth } = useReauth();
  const attempt = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        if (!isReauthRequired(error)) throw error;
        await requestReauth();
        return fn();
      }
    },
    [requestReauth],
  );
  return { attempt };
}

export function ReauthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<{ resolve: () => void; reject: (reason?: unknown) => void } | null>(
    null,
  );

  const requestReauth = useCallback((): Promise<void> => {
    // A prompt is already in flight; the caller joins the same one.
    if (open) {
      return new Promise<void>((resolve, reject) => {
        pendingRef.current = { resolve, reject };
      });
    }
    setOpen(true);
    return new Promise<void>((resolve, reject) => {
      pendingRef.current = { resolve, reject };
    });
  }, [open]);

  const settle = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    return pending;
  }, []);

  const onSuccess = useCallback(() => {
    settle()?.resolve();
  }, [settle]);

  const onDismiss = useCallback(() => {
    settle()?.reject(new ApiError(403, REAUTH_REQUIRED_MESSAGE));
  }, [settle]);

  const value = useMemo(() => ({ requestReauth }), [requestReauth]);

  return (
    <ReauthContext.Provider value={value}>
      {children}
      <ReauthDialog open={open} onSuccess={onSuccess} onDismiss={onDismiss} />
    </ReauthContext.Provider>
  );
}

export function useReauth(): ReauthContextValue {
  const ctx = useContext(ReauthContext);
  if (!ctx) throw new Error("useReauth must be used within ReauthProvider");
  return ctx;
}
