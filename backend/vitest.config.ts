import { defineConfig } from 'vitest/config'

/**
 * Until this file existed, vitest ran on its defaults — which meant it globbed
 * every `*.test.*` under the workspace, `dist/` included. Anyone who had run
 * `npm run build` locally then saw three failed test FILES sitting next to
 * "52 passed": the compiled copies of the same tests, failing on their imports.
 *
 * CI never caught it because CI runs `test` before `build`, so `dist/` did not
 * exist yet. That ordering is luck, not a guarantee — this makes it explicit.
 */
export default defineConfig({
  test: {
    // Only the real sources. `dist` is a build artefact and must never be able
    // to fail the suite; `android`/`ios` are Expo prebuild output in the app
    // workspaces and contain no tests of ours.
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/android/**', '**/ios/**'],
    environment: 'node',
  },
})
