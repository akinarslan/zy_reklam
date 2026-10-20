import {spawn} from 'node:child_process';
import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {diagnosticExit} from './helpers/gpu-policy.mjs';
const out='docs/evidence/gpu-diagnostics';await mkdir(out+'/results',{recursive:true});
// Preserve old evidence; use only records produced by this invocation.
const started=Date.now();
const child=spawn(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap','tests/diagnostics/*.test.mjs'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{const text=b.toString();log+=text;process.stdout.write(text);});
const code=await new Promise(resolve=>child.on('exit',(code,signal)=>resolve(signal?2:code)));
await writeFile(out+'/tests.tap',log);
const records=[];for(const file of await readdir(out+'/results')){const row=JSON.parse(await readFile(out+'/results/'+file,'utf8'));if(Date.parse(row.at)>=started)records.push(row);}
const failedTests=Number(log.match(/^# fail (\d+)$/m)?.[1]??-1);
const exit=records.length===5?diagnosticExit(code,records,failedTests):1,warning=exit===0&&code!==0;
await writeFile(out+'/summary.json',JSON.stringify({at:new Date().toISOString(),testExitCode:code,failedTests,policyExitCode:exit,hardwareWarning:warning,records},null,2));
if(warning)console.warn('::warning::GPU timing acceptance did not pass on this runner. Assertions failed and are preserved in the diagnostic artifact; functional health checks remained intact.');
if(exit)console.error('GPU diagnostics contain a functional failure, crash, context loss, invalid evidence or unclassified error.');
process.exitCode=exit;
