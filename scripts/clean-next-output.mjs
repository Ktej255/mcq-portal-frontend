import { rmSync } from "node:fs";
import { basename, resolve, sep } from "node:path";

const workspace = resolve(process.cwd());
const nextOutput = resolve(workspace, ".next");

if (
  basename(nextOutput) !== ".next" ||
  !nextOutput.startsWith(`${workspace}${sep}`)
) {
  throw new Error(`Refusing to remove unexpected build output: ${nextOutput}`);
}

rmSync(nextOutput, { recursive: true, force: true });
console.log(`Cleared generated Next.js output: ${nextOutput}`);
