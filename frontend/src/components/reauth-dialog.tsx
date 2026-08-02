/**
 * Password prompt for §8.3 re-authentication.
 *
 * Controlled by ReauthProvider. Submits the password to /auth/reauth/, which
 * refreshes the user's `last_reauth_at` so the guarded mutation's retry passes
 * `HasRecentReauth`. Wrong password keeps the dialog open with an error.
 */

import { useRef, useState } from "react";

import { api } from "../lib/api/client";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ReauthDialogProps {
  open: boolean;
  onSuccess: () => void;
  onDismiss: () => void;
}

export function ReauthDialog({ open, onSuccess, onDismiss }: ReauthDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/reauth/", { password });
      setPassword("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not re-authenticate.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-authenticate to continue</DialogTitle>
          <DialogDescription>
            This action is protected (design doc §8.3). Confirm your password to unlock it for the
            next 15 minutes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              ref={inputRef}
              id="reauth-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onDismiss} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !password}>
              {busy ? "Verifying…" : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
