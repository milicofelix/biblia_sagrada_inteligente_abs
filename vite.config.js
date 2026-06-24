import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';

const useRemoteFonts = process.env.VITE_USE_REMOTE_FONTS === 'true';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: useRemoteFonts
                ? [
                      bunny('Instrument Sans', {
                          weights: [400, 500, 600],
                      }),
                  ]
                : [],
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5176',
        cors: {
            origin: 'http://localhost:8086',
        },
        hmr: {
            host: 'localhost',
            port: 5176,
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
