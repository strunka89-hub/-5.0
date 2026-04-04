import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dist = path.join(root, 'dist');
const htmlName = 'мой сайт 5.0.html';

await fs.promises.mkdir(dist, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'i18n.js')],
  bundle: false,
  minify: true,
  outfile: path.join(dist, 'i18n.min.js'),
  legalComments: 'none'
});

await esbuild.build({
  entryPoints: [path.join(root, 'script.js')],
  bundle: false,
  minify: true,
  outfile: path.join(dist, 'script.min.js'),
  legalComments: 'none'
});

await esbuild.build({
  entryPoints: [path.join(root, 'magic-rings.js')],
  bundle: false,
  minify: true,
  outfile: path.join(dist, 'magic-rings.min.js'),
  legalComments: 'none'
});

await esbuild.build({
  entryPoints: [path.join(root, 'target-cursor.js')],
  bundle: false,
  minify: true,
  outfile: path.join(dist, 'target-cursor.min.js'),
  legalComments: 'none'
});

await esbuild.build({
  entryPoints: [path.join(root, 'styles.css')],
  bundle: false,
  minify: true,
  outfile: path.join(dist, 'styles.min.css')
});

await esbuild.build({
  entryPoints: [path.join(root, 'target-cursor.css')],
  bundle: false,
  minify: true,
  outfile: path.join(dist, 'target-cursor.min.css')
});

const htmlPath = path.join(root, htmlName);
let html = await fs.promises.readFile(htmlPath, 'utf8');
html = html.replace(/href="styles\.css"/g, 'href="styles.min.css"');
html = html.replace(/href="target-cursor\.css"/g, 'href="target-cursor.min.css"');
html = html.replace(/src="i18n\.js"/g, 'src="i18n.min.js"');
html = html.replace(/src="script\.js"/g, 'src="script.min.js"');
html = html.replace(/src="magic-rings\.js"/g, 'src="magic-rings.min.js"');
html = html.replace(/src="target-cursor\.js"/g, 'src="target-cursor.min.js"');
await fs.promises.writeFile(path.join(dist, 'index.html'), html, 'utf8');

const assets = ['hero-image.png', 'about-photo.png'];
for (const file of assets) {
  const from = path.join(root, file);
  try {
    await fs.promises.copyFile(from, path.join(dist, file));
  } catch {
    /* файл может отсутствовать локально */
  }
}

console.log('Сборка: dist/index.html + min JS/CSS (включая magic-rings, target-cursor)');
