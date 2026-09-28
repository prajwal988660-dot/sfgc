/**
 * Theme constants shared by the root layout (a Server Component) and the
 * ThemeToggle (a Client Component).
 *
 * This module deliberately carries no 'use client' directive. A Server
 * Component cannot read a plain value out of a client module — every export of
 * a 'use client' file becomes a client reference on the server, and touching it
 * throws "You cannot dot into a client module from a Server Component". The
 * pre-paint script is a string the layout must inline, so it lives here.
 */

export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'sfgc.theme'

/**
 * Runs before first paint, injected into <head>. Without it the page renders in
 * light mode and then snaps to dark, which is worse than no dark mode at all.
 * Kept as a string because it must execute synchronously, ahead of React.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || ((!stored || stored === 'system') && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`
