/** Jest config pentru mobile (jest-expo preset) */
module.exports = {
  preset: 'jest-expo',
  // Monorepo: babel.test.config.js adaugă explicit plugin-ul Flow
  // (babel-preset-expo singur NU strip-uiește react-native Flow în npm workspaces)
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { configFile: require.resolve('./babel.test.config.js') }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*|@tanstack/.*|zod)',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@pawfectpair/shared$': '<rootDir>/../packages/shared/src/index.ts',
    '^@pawfectpair/shared/(.*)$': '<rootDir>/../packages/shared/src/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: ['components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', '!**/*.d.ts'],
  verbose: true,
};
