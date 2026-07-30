/**
 * Le build se fait en deux passes (voir vite.config.ts) et `vite build --watch`
 * ne rend jamais la main : impossible de les enchainer avec `&&`. Ce script
 * lance donc les deux watchers en parallele sur le meme outDir.
 *
 * Le nettoyage initial est fait ici, une seule fois. En mode watch les deux
 * passes ont `emptyOutDir` a false, sans quoi la passe `main` effacerait a
 * chaque rebuild le content_script.js produit par la passe `content`.
 */
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const browser = process.env.TARGET_BROWSER ?? 'chrome';
const mode = process.env.BUILD_MODE ?? 'development';

rmSync(`dist/${browser}`, { recursive: true, force: true });

const children = ['main', 'content'].map(pass =>
  spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'build', '--mode', mode, '--watch'],
    {
      stdio: 'inherit',
      env: { ...process.env, TARGET_BROWSER: browser, BUILD_PASS: pass }
    }
  )
);

let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exit(code);
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
// Si un watcher meurt, l'autre continuerait a ecrire dans un dist a moitie a
// jour : plus lisible de tout arreter.
for (const child of children) child.on('exit', code => stopAll(code ?? 0));
