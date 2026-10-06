import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        profile: resolve(root, 'profile/profile.html'),
        skills: resolve(root, 'skills/skills.html'),
        work: resolve(root, 'projects/index.html'),
        project2024: resolve(root, 'projects/2024.html'),
        project2025: resolve(root, 'projects/2025.html'),
        project2026: resolve(root, 'projects/2026.html')
      }
    }
  }
});
