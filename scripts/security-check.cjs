const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const excluded = new Set(['node_modules','.git','.expo','dist','web-build']);
const risky = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:api[_-]?key|secret|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_./+\-=]{16,}["']/i,
  /Bearer\s+[A-Za-z0-9._-]{20,}/i,
];
const publicEnv = fs.readFileSync(path.join(root,'.env.example'),'utf8');
if (/^(?!#).*(password|token|secret)\s*=/im.test(publicEnv)) throw new Error('.env.example contém variável de segredo/credencial.');
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    if(excluded.has(name)) continue;
    const p=path.join(dir,name); const st=fs.statSync(p);
    if(st.isDirectory()) walk(p);
    else if(/\.(ts|tsx|js|cjs|mjs|json|md)$/.test(name)){
      const data=fs.readFileSync(p,'utf8');
      for(const re of risky){ if(re.test(data)) throw new Error(`Possível segredo hardcoded em ${path.relative(root,p)}`); }
    }
  }
}
walk(path.join(root,'src'));
const storage = fs.readFileSync(path.join(root,'src/services/StorageService.ts'),'utf8');
if (/setItem[^\n]*(password|senha)/i.test(storage)) throw new Error('StorageService aparenta persistir senha.');
console.log('security-check: nenhum segredo hardcoded óbvio e nenhuma persistência de senha detectados.');
