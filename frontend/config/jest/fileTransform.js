import path from 'node:path';

// This is a custom Jest transformer turning file imports into filenames.
// http://facebook.github.io/jest/docs/en/webpack.html
// Updated for ESM support

export default {
  process(_src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    if (filename.match(/\.svg$/)) {
      // Return ES6 module format for SVG files
      return {
        code: `export default ${assetFilename};
export const ReactComponent = (props) => ({
  $$typeof: Symbol.for('react.element'),
  type: 'svg',
  ref: null,
  key: null,
  props: Object.assign({}, props, {
    children: ${assetFilename}
  })
});`,
      };
    }

    // Return ES6 module format for other image files
    return {
      code: `export default ${assetFilename};`,
    };
  },
};
