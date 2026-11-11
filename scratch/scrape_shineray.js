const fs = require('fs');

async function main() {
  try {
    const res = await fetch('https://shineray.com.br');
    const html = await res.text();
    
    // Find all links
    const matches = [...html.matchAll(/href=["'](https?:\/\/shineray\.com\.br\/[^"'#?]+)/g)];
    const urls = [...new Set(matches.map(m => m[1]))];
    
    console.log('Total URLs found on home:', urls.length);
    
    // Check sitemap or categories
    const interesting = urls.filter(u => {
      const lower = u.toLowerCase();
      return !lower.includes('/wp-') &&
             !lower.includes('/category/') &&
             !lower.includes('/tag/') &&
             !lower.includes('/author/') &&
             !lower.includes('/politica') &&
             !lower.includes('/privacidade') &&
             !lower.includes('/contato') &&
             !lower.includes('/concessionarias') &&
             !lower.includes('/trabalhe') &&
             !lower.includes('/imprensa') &&
             !lower.includes('/sobre') &&
             !lower.includes('/revenda') &&
             !lower.includes('/pecas') &&
             !lower.includes('/assistencia');
    });
    
    console.log('Interesting URLs:', interesting);
    
    // Also let's check sitemap.xml
    try {
      const sitemapRes = await fetch('https://shineray.com.br/sitemap.xml');
      const sitemapTxt = await sitemapRes.text();
      const locs = [...sitemapTxt.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      console.log('Sitemap locs:', locs);
      
      // If there are sub-sitemaps (like post-sitemap, page-sitemap, product-sitemap)
      for (const loc of locs) {
        if (loc.includes('sitemap')) {
          const subRes = await fetch(loc);
          const subTxt = await subRes.text();
          const subLocs = [...subTxt.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
          console.log(`Sub-sitemap ${loc} found ${subLocs.length} URLs`);
          fs.writeFileSync('scratch/sub_sitemap_' + loc.split('/').pop().replace(/[^a-z0-9]/gi, '_') + '.txt', subLocs.join('\n'));
        }
      }
    } catch (err) {
      console.log('Error checking sitemap:', err.message);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
