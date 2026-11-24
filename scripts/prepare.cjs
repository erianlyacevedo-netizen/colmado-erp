const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),stage=path.join(root,'desktop-runtime');
if(process.platform!=='win32')throw Error('Compila en Windows x64 o usa el workflow de GitHub.');
fs.rmSync(stage,{recursive:true,force:true});fs.mkdirSync(stage,{recursive:true});
const env={...process.env,DATABASE_URL:'file:'+path.join(stage,'template.db').replace(/\\/g,'/'),AUTH_SECRET:require('node:crypto').randomBytes(48).toString('hex'),COLMADO_DESKTOP:'1',NEXT_TELEMETRY_DISABLED:'1'};
function run(file,args,cwd=root){const r=spawnSync(process.execPath,[file,...args],{cwd,env,stdio:'inherit'});if(r.status!==0)throw Error('Falló '+file+' '+args.join(' '));}
const prisma=path.join(root,'node_modules','prisma','build','index.js');run(prisma,['validate']);run(prisma,['generate']);run(prisma,['db','push','--skip-generate']);run(path.join(root,'node_modules','typescript','bin','tsc'),['--noEmit']);run(path.join(root,'node_modules','vitest','vitest.mjs'),['run']);run(path.join(root,'node_modules','next','dist','bin','next'),['build']);
for(const name of ['.next','public','next.config.js','package.json'])fs.cpSync(path.join(root,name),path.join(stage,name),{recursive:true,filter:p=>!p.includes(path.sep+'.next'+path.sep+'cache')});
fs.copyFileSync(path.join(root,'desktop','init.cjs'),path.join(stage,'init.cjs'));
// Copy only production packages and their transitive dependencies using npm's installed tree.
const npm=process.env.npm_execpath;if(!npm)throw Error('Ejecuta npm run dist');
const tree=spawnSync(process.execPath,[npm,'ls','--omit=dev','--all','--parseable'],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});if(tree.status!==0)throw Error(tree.stderr||'Árbol npm inválido');
for(const line of tree.stdout.trim().split(/\r?\n/)){const dir=line.trim();const rel=path.relative(root,dir);if(!rel.startsWith('node_modules'+path.sep)||!fs.existsSync(dir))continue;fs.cpSync(dir,path.join(stage,rel),{recursive:true,filter:p=>p===dir||!path.relative(dir,p).split(path.sep).includes('node_modules')});}
fs.cpSync(path.join(root,'node_modules','.prisma'),path.join(stage,'node_modules','.prisma'),{recursive:true});
console.log('Runtime preparado.');
