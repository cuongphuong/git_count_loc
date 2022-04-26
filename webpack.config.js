const path = require('path');

const devMode = false;

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: {
    'contentScript': [
      "./src/index.js",
      "./src/gitlab.js",
      "./src/github.js"
    ],
    'background': path.resolve(__dirname, './src/background.js')
  },

  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, 'app/')
  }
};