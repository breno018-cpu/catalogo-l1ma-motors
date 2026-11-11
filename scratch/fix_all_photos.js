const fs = require('fs');

async function fixAllPhotos() {
  const allWp = JSON.parse(fs.readFileSync('scratch/all_wp_products.json', 'utf8'));
  const refined = JSON.parse(fs.readFileSync('scratch/refined_shineray_models.json', 'utf8'));

  console.log(`Processing media for ${refined.length} models...`);

  const wpById = {};
  allWp.forEach(w => wpById[w.id] = w);

  for (let i = 0; i < refined.length; i++) {
    const p = refined[i];
    // Find matching WP item
    const wpItem = allWp.find(w => `shineray-${w.slug}` === p.id || w.slug === p.id.replace('shineray-', ''));
    if (!wpItem) {
      console.warn(`No WP item found for ${p.id}`);
      continue;
    }

    const featured = wpItem.featured;
    const modelSlug = wpItem.slug.toLowerCase();
    const cleanSlug = modelSlug.replace(/-(?:efi|2|ss|s|v2|cs)$/g, '');

    // Fetch official media attachments for this post
    let attachedMedia = [];
    try {
      const res = await fetch(`https://www.shineray.com.br/wp-json/wp/v2/media?parent=${wpItem.id}&per_page=15`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const mediaList = await res.json();
        if (Array.isArray(mediaList)) {
          attachedMedia = mediaList
            .map(m => m.source_url)
            .filter(u => {
              if (!u) return false;
              const uLower = u.toLowerCase();
              // Exclude logos, icons, banners, and other vehicles
              if (uLower.includes('logo') || uLower.includes('icon') || uLower.includes('banner-destaque')) return false;
              if (uLower.includes('cge') || uLower.includes('tlux') || uLower.includes('dtruck')) return false;
              if (uLower.includes('-150x') || uLower.includes('-300x')) return false;
              return true;
            });
        }
      }
    } catch (e) {
      console.warn(`Error fetching media for ${p.id}:`, e.message);
    }

    // Assemble clean photos list:
    // 1st photo MUST ALWAYS be the official featured media!
    const cleanPhotos = [];
    if (featured) {
      cleanPhotos.push(featured);
    }

    // Add only authentic attached media
    for (const u of attachedMedia) {
      if (!cleanPhotos.includes(u) && cleanPhotos.length < 5) {
        cleanPhotos.push(u);
      }
    }

    // If still only 1 photo, keep only the featured photo.
    // NEVER EVER add images from other vehicles!
    p.photos = cleanPhotos.length ? cleanPhotos : (featured ? [featured] : ['icon.svg']);

    console.log(`[${i + 1}/${refined.length}] ${p.name}: ${p.photos.length} photos`);
    if (p.photos.length) {
      console.log(`   Featured: ${p.photos[0]}`);
    }

    // Be polite to the server
    await new Promise(r => setTimeout(r, 120));
  }

  fs.writeFileSync('scratch/refined_shineray_models_fixed.json', JSON.stringify(refined, null, 2));
  console.log('Successfully saved to scratch/refined_shineray_models_fixed.json');
}

fixAllPhotos();
