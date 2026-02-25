import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const markerRegex = /^(<<<<<<<|=======|>>>>>>>)( .*)?$/m;
const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean);

const offenders = [];

for (const file of files) {
  try {
    const content = readFileSync(file);
    if (content.includes(0)) continue;
    const text = content.toString('utf8');
    if (markerRegex.test(text)) offenders.push(file);
  } catch {
    // ignora arquivos que não puderem ser lidos no momento
  }
}

if (offenders.length > 0) {
  console.error('❌ Marcadores de conflito de merge encontrados:');
  offenders.forEach((file) => console.error(` - ${file}`));
  process.exit(1);
}

console.log('✅ Nenhum marcador de conflito de merge encontrado.');
