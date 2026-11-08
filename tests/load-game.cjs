const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function(root){
 const html=fs.readFileSync(path.join(root,'public/game.html'),'utf8');
 const files=[...html.matchAll(/<script src="(game\/[^"]+\.js)" defer><\/script>/g)].map(m=>m[1]);
 if(files.length!==9)throw Error('Missing game scripts');
 const sources=files.map(file=>({file,code:fs.readFileSync(path.join(root,'public',file),'utf8')}));
 return {html,script:sources.map(s=>s.code).join('\n'),load(sandbox){for(const s of sources)vm.runInContext(s.code,sandbox,{filename:s.file})}};
};
