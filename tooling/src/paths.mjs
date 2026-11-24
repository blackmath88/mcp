import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const TOOLING_ROOT=fileURLToPath(new URL('../',import.meta.url));
export const REPO_ROOT=resolve(TOOLING_ROOT,'..');
export const LAB_ROOT=resolve(process.env.LAB_HOME || resolve(REPO_ROOT,'.lab'));
