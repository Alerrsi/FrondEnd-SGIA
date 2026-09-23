// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Patrón de hidratación del tema propio del template de Expo.
    files: ['src/hooks/use-color-scheme*.ts', 'src/hooks/use-theme.ts'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);