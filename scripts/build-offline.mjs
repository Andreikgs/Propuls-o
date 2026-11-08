import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const html = readFileSync(resolve(root, 'public/game.html'), 'utf8');
// Use the hosted page as the single source of script order. Offline needs no server.
const offline = html.replace('<link rel="stylesheet" href="menu.css">', () => '<style>' + readFileSync(resolve(root, 'public/menu.css'), 'utf8') + '</style>').replace(/<script src="(game\/[^"]+\.js)" defer><\/script>/g,
  (_, relative) => '<script>\n' + readFileSync(resolve(root, 'public', relative), 'utf8').replace(/<\/script/gi, '<\\/script') + '\n</script>');
for (const file of ['Propulsao-Offline.html', 'Oval-Rush-Offline.html', 'public/Propulsao-Offline.html']) {
  const target = resolve(root, file);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== offline) throw new Error(file + ' is stale. Run node scripts/build-offline.mjs');
  } else writeFileSync(target, offline);
}
console.log(process.argv.includes('--check') ? 'Offline exports verified.' : 'Offline exports generated.');
