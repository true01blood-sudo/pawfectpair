/**
 * Config Babel dedicat pentru Jest (nu e folosit de app!).
 * De ce există: babel-preset-expo@11 (devDep) trage @react-native/babel-preset@0.74
 * care NU cunoaște sintaxa Flow nouă din react-native 0.76 (ex. mapped types).
 * Aici folosim explicit preset-ul 0.76 corect (fixat în devDependencies).
 */
module.exports = {
  presets: [require.resolve('@react-native/babel-preset')],
  plugins: [
    // aliasurile @/ și @pawfectpair/shared (backup pentru moduleNameMapper)
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
          '@pawfectpair/shared': '../packages/shared/src/index.ts',
          '@pawfectpair/shared/': '../packages/shared/src/',
        },
      },
    ],
  ],
};

