import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const contract=JSON.parse(fs.readFileSync(new URL('../docs/backend-contract.json',import.meta.url),'utf8'));
let routes=contract.backendRoutes;
if(process.env.BACKEND_SOURCE){
  const root=path.join(process.env.BACKEND_SOURCE,'src/main/java/icu/telepathystudios/puretender/controller');
  routes=fs.readdirSync(root).filter(f=>f.endsWith('.java')).flatMap(file=>{
    const text=fs.readFileSync(path.join(root,file),'utf8');
    const base=text.match(/@RequestMapping\("([^"]+)"\)/)?.[1];
    if(!base)return [];
    return [...text.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\s*\(\s*(?:value\s*=\s*)?"([^"]*)"[^)]*\))?/g)].map(m=>({method:m[1].toUpperCase(),path:base+(m[2]||''),controller:file}));
  });
}
const key=r=>`${r.method} ${r.path.replace(/^\/api\/v1/,'').replace(/\{[^}]+\}/g,'{id}')}`;
const actual=new Set(routes.map(key));
for(const call of contract.frontendImplementedCalls)assert(actual.has(key(call)),`Missing implemented operation: ${key(call)}`);
const pending=contract.pendingEndpoints.filter(call=>!actual.has(key(call)));
console.log(`PASS: ${contract.frontendImplementedCalls.length} frontend operations match Java controller routes.`);
console.log(`Source: ${process.env.BACKEND_SOURCE||'packaged source snapshot'} (${contract.commit})`);
console.log(`${pending.length} optional endpoints remain pending:`);
for(const call of pending)console.log(`  ${key(call)}`);
