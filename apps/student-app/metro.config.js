// Metro configured for the npm-workspaces monorepo: the app lives in
// apps/student-app but resolves @sfgc/shared from packages/shared at the root.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the whole workspace so edits to packages/shared trigger a rebuild.
config.watchFolders = [workspaceRoot]

// Look in the app's own node_modules first, then the hoisted root one.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// NOTE: do NOT set `disableHierarchicalLookup = true` here.
//
// npm nests this app's copies of expo's own dependencies inside
// apps/student-app/node_modules/expo/node_modules/ (expo-asset, expo-file-system,
// babel-preset-expo, …). Metro finds those by walking up from the importing
// file, so disabling hierarchical lookup makes the bundle fail with
// "Unable to resolve expo-asset from expo/src/Expo.fx.tsx".
//
// The duplicate-React risk that flag guards against is already handled: npm
// installs React 19 inside each app while the website's React 18 stays at the
// root, and nodeModulesPaths above searches the app first.

module.exports = config
