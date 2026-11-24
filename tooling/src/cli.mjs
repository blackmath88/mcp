#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { Lab } from './core.mjs';
import { markdown, html } from './report.mjs';
const [command, argument, output] = process.argv.slice(2);
const lab = new Lab();
try {
  let result;
  if (command === 'list') result = lab.list();
  else if (command === 'show') result = lab.snapshot(argument);
  else if (command === 'report') { const r=lab.snapshot(argument); if(output){writeFileSync(output,output.endsWith('.html')?html(r,lab):markdown(r),{mode:0o600});result={written:output};}else result=markdown(r); }
  else if (command === 'call') { const allowed=['createMission','createRun','linkRun','finishRun','putArtifact','verify','submitJudge','feedback']; if(!allowed.includes(argument))throw new Error('Unknown operation'); const input=JSON.parse(readFileSync(0,'utf8')); result=lab[argument](input); }
  else if (command === 'artifact') { const a=lab.artifact(argument); if(!output)throw new Error('Provide an output path');writeFileSync(output,a.bytes,{mode:0o600});result={written:output,sha256:a.sha256}; }
  else throw new Error('Usage: node tooling/src/cli.mjs list | show ID | report ID [report.html] | artifact ID PATH | call OP < input.json');
  console.log(typeof result==='string'?result:JSON.stringify(result,null,2));
} catch(e) { console.error(e.message);process.exitCode=1; } finally { lab.close(); }
