/**
 * Upload mods + shaders + textures vers GitHub Releases (tag: mods-latest)
 * Usage: node upload-mods.js <GH_TOKEN> <fichier1> [fichier2] [fichier3] ...
 */

const https = require('https');
const fs    = require('fs');

const TOKEN = process.argv[2];
const FILES = process.argv.slice(3);
const OWNER = 'kogareyli';
const REPO  = 'shangrimclauncher';
const TAG   = 'mods-latest';

if (!TOKEN || FILES.length === 0) {
  console.error('Usage: node upload-mods.js <GH_TOKEN> <fichier1> [fichier2] ...');
  process.exit(1);
}
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('Fichier introuvable:', f); process.exit(1); }
}

function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path:     urlPath,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent':    'ShangriMc-Uploader',
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function uploadAsset(uploadUrl, filePath) {
  return new Promise((resolve, reject) => {
    const filename   = require('path').basename(filePath);
    const size       = fs.statSync(filePath).size;
    const fileStream = fs.createReadStream(filePath);
    const base       = uploadUrl.replace('{?name,label}', '');
    const url        = new URL(`${base}?name=${encodeURIComponent(filename)}`);

    let done = 0;
    fileStream.on('data', chunk => {
      done += chunk.length;
      process.stdout.write(`\r  ${filename}: ${((done/size)*100).toFixed(1)}% (${(done/1024/1024).toFixed(1)}/${(size/1024/1024).toFixed(1)} Mo)`);
    });

    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers: {
        'Authorization':  `token ${TOKEN}`,
        'User-Agent':     'ShangriMc-Uploader',
        'Accept':         'application/vnd.github.v3+json',
        'Content-Type':   'application/zip',
        'Content-Length': size,
      },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log('');
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    fileStream.pipe(req);
  });
}

async function main() {
  console.log('=== ShangriMc — Upload vers GitHub Releases ===\n');
  for (const f of FILES) {
    console.log(` - ${require('path').basename(f)} (${(fs.statSync(f).size/1024/1024).toFixed(1)} Mo)`);
  }

  // 1. Cherche ou cree la release mods-latest
  console.log('\n[1/3] Recherche de la release "mods-latest"...');
  const listRes = await apiRequest('GET', `/repos/${OWNER}/${REPO}/releases`);
  let release = Array.isArray(listRes.body) && listRes.body.find(r => r.tag_name === TAG);

  if (release) {
    console.log('      Release existante trouvee.');
    // Supprime les assets existants qui ont le meme nom
    const existingNames = FILES.map(f => require('path').basename(f));
    for (const asset of (release.assets || [])) {
      if (existingNames.includes(asset.name)) {
        await apiRequest('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${asset.id}`);
        console.log(`      Ancien asset supprime: ${asset.name}`);
      }
    }
  } else {
    console.log('      Creation de la release...');
    const createRes = await apiRequest('POST', `/repos/${OWNER}/${REPO}/releases`, {
      tag_name:         TAG,
      name:             'Mods & Ressources ShangriMc',
      body:             'Mods, shaders et texture packs pour ShangriMc. Ne pas supprimer.',
      draft:            false,
      prerelease:       false,
      target_commitish: 'main',
    });
    if (createRes.status !== 201) {
      console.error('Erreur creation release:', JSON.stringify(createRes.body));
      process.exit(1);
    }
    release = createRes.body;
    console.log('      Release creee !');
  }

  // 2. Upload chaque fichier
  const urls = [];
  for (let i = 0; i < FILES.length; i++) {
    console.log(`\n[${i+2}/${FILES.length+1}] Upload: ${require('path').basename(FILES[i])}`);
    const res = await uploadAsset(release.upload_url, FILES[i]);
    if (res.status !== 201) {
      console.error('  Erreur upload:', JSON.stringify(res.body));
    } else {
      urls.push({ file: require('path').basename(FILES[i]), url: res.body.browser_download_url });
      console.log('  OK !');
    }
  }

  // 3. Affiche les URLs
  console.log('\n==============================================');
  console.log('URLs de telechargement direct :');
  console.log('==============================================');
  for (const u of urls) {
    console.log(`\n${u.file}:`);
    console.log(`  ${u.url}`);
  }
  console.log('\n==============================================');
  console.log('Mets ces URLs dans main.js et publie une MAJ !');
}

main().catch(err => { console.error(err); process.exit(1); });
