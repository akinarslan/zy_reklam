import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const baseline='13dfebc6666b7dcfcf880228aab5a93ea928396e';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
test('CI policy release keeps production runtime identical to the approved main baseline',()=>{
 const htmlBase=git('rev-parse','HEAD')==='756aa4984a04e14adcea1e86dc2c16e612097041'?'HEAD':'HEAD^1';
 assert.equal(git('diff','--name-only',htmlBase,'HEAD','--','index.html'),'','CI-only commit must preserve the HTML inherited from main; intentional earlier main edits remain');
 const paths=['src','worker','public','scripts','admin','vite.config.ts','wrangler.jsonc','package.json','package-lock.json','tsconfig.json'];
 assert.equal(git('diff','--name-only',baseline,'HEAD','--',...paths),'','Runtime/config/assets/build inputs must not change in the CI-only release');
 assert.equal(git('diff','--name-only',baseline,'--','src','worker','scripts','vite.config.ts','wrangler.jsonc','package.json','package-lock.json','tsconfig.json'),'','Uncommitted runtime tuning is prohibited too');
 const engines=['src/matrix','src/showroom','src/scene/renderer.ts','src/scene/rotation.ts','src/scene/back.ts','src/scene/logo.ts','src/scene/quality.ts','worker','wrangler.jsonc'];
 assert.equal(git('diff','--name-only','13dfebc6666b7dcfcf880228aab5a93ea928396e','HEAD','--',...engines),'','Matrix/3D engines must stay at the user-approved 13dfebc freeze; PR10 is excluded');
});
