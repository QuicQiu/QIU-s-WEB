import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, cpSync } from 'node:fs';

const root = fileURLToPath(new URL('.', import.meta.url));

function copyStaticFolders() {
  return {
    name: 'copy-static-folders',
    closeBundle() {
      const folders = [
        ['profile/docs', 'dist/profile/docs'],
        ['projects/docs', 'dist/projects/docs'],
        ['skills/archive', 'dist/skills/archive']
      ];

      for (const [fromRel, toRel] of folders) {
        const from = resolve(root, fromRel);
        const to = resolve(root, toRel);
        if (!existsSync(from)) continue;
        mkdirSync(to, { recursive: true });
        cpSync(from, to, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  plugins: [copyStaticFolders()],
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
