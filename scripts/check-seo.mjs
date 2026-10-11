import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'https://www.fibercut.si/';
const home = fs.readFileSync('index.html','utf8');
const gallery = fs.readFileSync('gallery.html','utf8');
for (const [file,html,url] of [['index.html',home,base],['gallery.html',gallery,base+'gallery.html']]) {
  assert.equal([...html.matchAll(/<h1[ >]/g)].length,1,`${file}: one main heading`);
  assert.equal([...html.matchAll(/rel="canonical"/g)].length,1);
  assert.ok(html.includes(`rel="canonical" href="${url}"`));
  assert.ok(html.includes('<html lang="sl"'));
  const json = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(json.length,1);
  const data = JSON.parse(json[0][1]);
  assert.equal(data['@context'],'https://schema.org');
  assert.ok(data['@graph'].some(n=>n.url===url));
  for (const [,path] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(path)) continue;
    const local = path.split('#')[0];
    assert.ok(fs.existsSync(local),`${file}: missing local asset ${local}`);
  }
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`),`${file}: missing anchor ${id}`);
}
const graph=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const company=graph.find(n=>n['@type']==='LocalBusiness');
assert.equal(company.address.streetAddress,'Gabrovka 75');
assert.ok(home.includes(company.email));
assert.ok(home.includes('tel:'+company.telephone));
assert.equal(company.hasOfferCatalog.itemListElement.length,5);
for(const offer of company.hasOfferCatalog.itemListElement) assert.ok(home.includes(`id="${offer.itemOffered.url.split('#')[1]}"`));
assert.ok(home.includes('<noscript>'));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
assert.equal([...sitemap.matchAll(/<url>/g)].length,2);
const photos=[...gallery.matchAll(/<a class="card" href="([^"]+)"/g)].map(m=>m[1]);
assert.equal([...sitemap.matchAll(/<image:loc>/g)].length,photos.length);
for(const path of photos)assert.ok(sitemap.includes(`<image:loc>${base+path}</image:loc>`));
assert.ok(fs.readFileSync('robots.txt','utf8').includes('Sitemap: '+base+'sitemap.xml'));
console.log(`PASS: canonical URLs, JSON-LD, static content, local links, anchors and ${photos.length} sitemap images.`);
