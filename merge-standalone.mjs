import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(join(__dirname, f), 'utf8');

let html = read('мой сайт 5.0.html');
const css = read('styles.css') + '\n' + read('target-cursor.css');
const i18n = read('i18n.js');
const main = read('script.js');
const mr = read('magic-rings.js');
const tc = read('target-cursor.js');

html = html.replace(
  '<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="target-cursor.css">',
  `<style>\n${css}\n</style>`
);

const inlineScripts = `<script>\n${i18n}\n</script>\n<script>\n${main}\n</script>\n<script>\n${mr}\n</script>\n<script>\n${tc}\n</script>`;

html = html.replace(
  /<script src="i18n\.js"><\/script>\s*<script src="script\.js"><\/script>\s*<script src="magic-rings\.js"><\/script>\s*<script src="target-cursor\.js"><\/script>/,
  inlineScripts
);

fs.writeFileSync(join(__dirname, 'site-standalone.html'), html, 'utf8');
console.log('OK: site-standalone.html');
