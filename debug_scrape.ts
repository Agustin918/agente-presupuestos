import * as fs from 'fs';
import * as path from 'path';

async function fetchAndSave(url: string, filename: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    console.log(`Status: ${response.status}`);
    const html = await response.text();
    fs.writeFileSync(path.join(__dirname, filename), html);
    console.log(`Saved ${filename} (${html.length} chars)`);
    
    // Extract potential prices
    const priceMatches = html.match(/\$\s*[\d.,]+/g);
    console.log('Potential price matches:', priceMatches?.slice(0, 10));
    
    // Look for common price class patterns
    const classMatches = html.match(/class="[^"]*price[^"]*"/gi);
    console.log('Price class patterns:', classMatches?.slice(0, 5));
  } catch (e) {
    console.error('Error:', e);
  }
}

(async () => {
  await fetchAndSave('https://www.lapistay26.com.ar/index.php?search=ladrillo&description=true', 'lapista.html');
  await fetchAndSave('https://hauster.com.ar/?s=ladrillo', 'hauster.html');
})();