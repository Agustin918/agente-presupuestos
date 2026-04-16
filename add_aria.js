const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'frontend', 'public', 'index.html'),
  path.join(__dirname, 'frontend', 'public', 'script.js')
];

files.forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    // Regex para buscar íconos que NO tengan aria-hidden aún
    content = content.replace(/<i class="(fas[^"]*)"><\/i>/g, '<i class="$1" aria-hidden="true"></i>');
    fs.writeFileSync(p, content);
    console.log('Procesado:', path.basename(p));
  }
});
