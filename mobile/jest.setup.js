/** Setup global pentru teste Jest mobile */
// Mock pentru expo modules care necesită nativ
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, { testID: 'expo-image' }, React.createElement(Text, null, 'img')),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'undetermined' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[xxx]' }),
}));

jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'test' } } } }));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ size: 1024, exists: true }),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  parse: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => () => {}),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

// mock Supabase — nu facem cereri reale în teste
// (cale relativă la mobile/jest.setup.js → ./lib/supabase/client)
jest.mock('./lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ unsubscribe: jest.fn() })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().returnThis(),
      insert: jest.fn().returnThis(),
      update: jest.fn().returnThis(),
      delete: jest.fn().returnThis(),
      eq: jest.fn().returnThis(),
      order: jest.fn().returnThis(),
      limit: jest.fn().returnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      single: jest.fn().mockResolvedValue({ data: null }),
    })),
    channel: jest.fn(() => ({ on: jest.fn().returnThis(), subscribe: jest.fn(), remove: jest.fn() })),
    removeChannel: jest.fn(),
    storage: { from: jest.fn(() => ({ upload: jest.fn(), getPublicUrl: jest.fn() })) },
  },
  supabaseUrl: 'https://test.supabase.co',
}));

// Silențios pentru warning-uri React 18 act warnings în teste
const origError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
  origError(...args);
};
