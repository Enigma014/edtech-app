module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@utils': './src/utils',
          '@components': './src/components',
          '@store': './src/store',
          '@assets': './src/assets',
          '@config': './src/config',
        },
      },
    ],
  ],
};