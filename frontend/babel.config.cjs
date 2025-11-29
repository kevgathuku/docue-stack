module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        // Keep ES6 modules for Jest ESM support
        modules: false,
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            // Keep ES6 modules for Jest ESM support
            modules: false,
          },
        ],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    },
  },
};
