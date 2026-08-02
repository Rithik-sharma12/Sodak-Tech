// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The API is proxied rather than called cross-origin. Session auth rides on a
// cookie, and same-origin keeps that simple: no CORS preflight on every
// mutation, no SameSite edge cases, and the CSRF cookie the API sets is
// readable back without special-casing the port.
//
// Production serves both behind one origin too (see deploy/nginx.conf), so the
// browser sees the same URLs in both environments and nothing has to be
// reconfigured between them.
const apiTarget = process.env["VITE_API_TARGET"] ?? "http://localhost:8000";

const proxy = {
  target: apiTarget,
  changeOrigin: false, // preserve Host so Django's CSRF origin check matches
  secure: false,
};

// @lovable.dev/vite-tanstack-config defaults the build to the cloudflare-module
// nitro preset, which is what the Lovable host deploys. For a self-hosted
// node/nginx deployment the same codebase builds with `NITRO_PRESET=node-server`
// (see deploy/nginx.conf and docs/DEPLOYMENT.md). Leaving the option unset keeps
// the Lovable default untouched.
const nitroPreset = process.env["NITRO_PRESET"];

export default defineConfig({
  // Spread so the key is absent (not `undefined`) when unset: the Lovable
  // options type forbids passing the property explicitly as undefined.
  ...(nitroPreset ? { nitro: { preset: nitroPreset } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/api": proxy,
        "/healthz": proxy,
        // Django's own admin, kept reachable for the operations it is better
        // at than a custom panel — inspecting a row, resetting a password.
        "/django-admin": proxy,
        "/static": proxy,
      },
    },
  },
});
