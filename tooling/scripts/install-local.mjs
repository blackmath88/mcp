#!/usr/bin/env node
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const tooling=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=resolve(tooling,'..');
const personas=process.argv[2];
if(!personas || !existsSync(resolve(personas,'tools/mcp-server.mjs')))throw new Error('Usage: node tooling/scripts/install-local.mjs /path/to/msteams-personas');
mkdirSync(join(root,'.codex'),{recursive:true});
const path=join(root,'.codex/config.toml');
const old=existsSync(path)?readFileSync(path,'utf8'):'';
if(old.includes('[mcp_servers.lab_factory]'))throw new Error('lab_factory already configured; inspect existing configuration before changing it');
const q=JSON.stringify;
writeFileSync(path,old+`
[mcp_servers.lab_factory]
command = ${q(process.execPath)}
args = [${q(join(tooling,'src/server.mjs'))}]
cwd = ${q(root)}
startup_timeout_sec = 20
tool_timeout_sec = 240
[mcp_servers.lab_factory.env]
LAB_HOME = ${q(join(root,'.lab'))}
PERSONAS_ROOT = ${q(resolve(personas))}
`,{mode:0o600});
console.log('Configured project-local Codex MCP:',path);
