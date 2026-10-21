import fs from 'node:fs';
import path from 'node:path';
const shell=fs.readFileSync('ui/shell.html','utf8');
const engine=fs.readFileSync('lib/game/engine.mjs','utf8').replace(/^export /gm,'');
const output=shell.replace('/*__STYLE__*/',fs.readFileSync('ui/styles.css','utf8')).replace('/*__DATA__*/','const DATA = '+fs.readFileSync('lib/game/data.json','utf8').trim().replace(/<\//g,'<\\/')+';').replace('/*__ENGINE__*/',engine).replace('/*__APP__*/',fs.readFileSync('ui/app.js','utf8'));
fs.mkdirSync('public',{recursive:true});fs.writeFileSync('public/games.html',output);
if(process.argv[2]){fs.mkdirSync(path.dirname(process.argv[2]),{recursive:true});fs.writeFileSync(process.argv[2],output);}
console.log('Standalone game built: '+Buffer.byteLength(output)+' bytes.');
