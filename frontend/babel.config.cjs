module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        // Transform ES6 modules to CommonJS for Jest
        modules: 'commonjs',
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
            // Ensure ES6 modules are transformed to CommonJS in test environment
            modules: 'commonjs',
          },
        ],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    },
  },
};
