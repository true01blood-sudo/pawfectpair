module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
    ],
    plugins: [
      // Pentru react-native-reanimated (necesar la PetMatch swipe animation)
      'react-native-reanimated/plugin',
      // Pentru importuri absolute @/* și @pawfectpair/shared/*
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
};
