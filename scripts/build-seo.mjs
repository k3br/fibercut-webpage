import fs from 'node:fs';

// Run from the repository root after changing public URLs or gallery entries.
const base = 'https://www.fibercut.si/';
const absolute = path => new URL(path,base).href;
const services = [
  ['ograje','Perforirane ograje po meri'],
  ['vzorci','Varjene in balkonske ograje po meri'],
  ['vrata','Drsna, samonosna in krilna dvoriščna vrata'],
  ['stene','Nadstreški, kovinske stopnice in konstrukcije po meri'],
  ['izmera','3D izmera Leica, načrtovanje, izdelava in montaža']
];
const business = {
  '@type':'LocalBusiness','@id':base+'#podjetje',name:'FiberCut',
  legalName:'Matic Podlogar s.p.',url:base,
  logo:absolute('assets/fibercut-logo-light.svg'),
  image:absolute('gallery/42_ograja.jpg'),
  telephone:'+38651744481',email:'info@fibercut.si',
  address:{'@type':'PostalAddress',streetAddress:'Gabrovka 75',postalCode:'1274',addressLocality:'Gabrovka',addressCountry:'SI'},
  hasOfferCatalog:{'@type':'OfferCatalog',name:'Izdelki in storitve FiberCut',itemListElement:services.map(([id,name])=>({
    '@type':'Offer',itemOffered:{'@type':'Service',name,url:base+'#'+id,provider:{'@id':base+'#podjetje'}}
  }))}
};
const gallery = fs.readFileSync('gallery.html','utf8');
const images = [...gallery.matchAll(/<a class="card" href="([^"]+)"><img[^>]+alt="([^"]+)"/g)].map(([,path,caption])=>({path,caption}));
for (const [file,title,description,pageType] of [
  ['index.html','Ograje, dvoriščna vrata in nadstreški po meri | FiberCut','FiberCut v Gabrovki: perforirane in varjene ograje, dvoriščna vrata, nadstreški ter kovinske stopnice po meri. 3D izmera Leica, izdelava in montaža.','WebPage'],
  ['gallery.html','Galerija ograj, vrat in nadstreškov po meri | FiberCut','Oglejte si izvedbe FiberCut: perforirane in balkonske ograje, vrata, nadstreški ter kovinske konstrukcije po meri. Fotografije zaključenih projektov.','CollectionPage']
]) {
  const url = file==='index.html' ? base : absolute(file);
  let html = fs.readFileSync(file,'utf8').replace(/\s*<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/g,'');
  html = html.replace(/<title>[\s\S]*?<\/title>/,`<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/,`<meta name="description" content="${description}" />`);
  const page = {'@type':pageType,'@id':url+'#stran',url,name:title,description,inLanguage:'sl-SI',about:{'@id':base+'#podjetje'}};
  if (file==='gallery.html') page.mainEntity = {'@type':'ItemList',itemListElement:images.map(({path,caption},i)=>({
    '@type':'ListItem',position:i+1,item:{'@type':'ImageObject',contentUrl:absolute(path),caption}
  }))};
  const graph = file==='index.html' ? [business,{'@type':'WebSite','@id':base+'#spletisce',url:base,name:'FiberCut',inLanguage:'sl-SI',publisher:{'@id':base+'#podjetje'}},page] : [page];
  const block = `
  <!-- SEO:START -->
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="sl_SI" />
  <meta property="og:site_name" content="FiberCut" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${absolute('gallery/42_ograja.jpg')}" />
  <meta property="og:image:width" content="1280" />
  <meta property="og:image:height" content="960" />
  <meta property="og:image:alt" content="Perforirana balkonska ograja po meri – izvedba FiberCut" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${absolute('gallery/42_ograja.jpg')}" />
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph},null,2)}</script>
  <!-- SEO:END -->
`;
  html = html.replace('</head>',block+'</head>');
  fs.writeFileSync(file,html);
}
const xml = text=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
fs.writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${base}</loc></url>
  <url><loc>${absolute('gallery.html')}</loc>
${images.map(({path})=>`    <image:image><image:loc>${xml(absolute(path))}</image:loc></image:image>`).join('\n')}
  </url>
</urlset>
`);
fs.writeFileSync('robots.txt',`User-agent: *
Allow: /

Sitemap: ${absolute('sitemap.xml')}
`);
console.log(`Updated metadata, JSON-LD, robots.txt and sitemap with ${images.length} gallery images.`);
