// LIBRARIES
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase-auth', test: /node_modules[\\/]@firebase[\\/]auth[\\/]/ },
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase|re2js|@grpc|protobufjs)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler|cookie)[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
});
