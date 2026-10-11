# SEO in objava

Končni naslov: **https://www.fibercut.si/**. Metapodatki, canonical, JSON-LD in sitemap so pripravljeni za ta naslov. Predogled na kodica.si ni canonical različica.

Po spremembah storitev, kontaktnih podatkov ali galerije posodobite `scripts/build-seo.mjs` in zaženite:

```sh
node scripts/build-seo.mjs
```

Vsebina storitev in galerija sta v statičnem HTML-ju. JavaScript in WebGL nista potrebna za branje besedil. JSON-LD opisuje dejansko podjetje, naslov, telefon in predstavljene storitve; ne vsebuje izmišljenih ocen, cen ali delovnega časa. Fotografije v zemljevidu so samo tiste, ki so trenutno objavljene v galeriji.

Ob objavi:

1. Objavite celotno stran na končni domeni, skupaj z `robots.txt` in `sitemap.xml` **v korenu domene**. Robots v podmapi predogleda ne upravlja indeksiranja domene.
2. Na gostovanju nastavite trajne preusmeritve HTTP → HTTPS, fibercut.si → www.fibercut.si in /index.html → /. Preusmeritve ne smejo ustvariti zanke. Nastavitev je odvisna od gostovanja; repozitorij je ne more zagotoviti.
3. Če predogled ostane javno dostopen, zanj na gostovanju nastavite `X-Robots-Tag: noindex`. Na končni domeni te glave ne uporabljajte. Canonical je namig za iskalnike, ne nadomestilo za preusmeritev.
4. Preverite domeno v Google Search Console in oddajte `https://www.fibercut.si/sitemap.xml`. Preverite začetno stran in galerijo z URL Inspection in Rich Results Test. Preverjanje lastništva potrebuje dostop do računa ali DNS.
5. Uskladite ime, telefon, naslov in URL z Google Business Profile. Izmerite Core Web Vitals na objavljeni strani; lokalno preverjanje kode ni meritev dejanske uporabniške hitrosti.

Sitemap ne potrebuje izmišljenih prioritet ali datumov zadnje spremembe. Po spremembi vsebine ga ponovno ustvarite. Meta keywords niso dodani. SEO ne zagotavlja določene uvrstitve ali roka indeksiranja.

Smernice: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
