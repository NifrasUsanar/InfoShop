import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            '@/Components': path.resolve(__dirname, './resources/js/Components'),
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        rollupOptions: {
            external: [
                'laravel-vite-plugin',
            ],
        },
    },
});
