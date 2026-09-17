// One-time helper: fetches shadcn/ui component sources from the public
// registry and writes them into src/, printing the npm deps they require.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const components = process.argv.slice(2);
const deps = new Set();

for (const name of components) {
  const url = `https://ui.shadcn.com/r/styles/new-york-v4/${name}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAILED ${name}: ${res.status}`);
    continue;
  }
  const json = await res.json();
  for (const d of json.dependencies ?? []) deps.add(d);
  for (const file of json.files ?? []) {
    // registry paths look like "registry/new-york-v4/ui/button.tsx"
    const rel = file.path.replace(/^registry\/[^/]+\//, "");
    const target = path.join("src", "components", rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
    console.log(`wrote ${target}`);
  }
}

console.log("DEPS:", [...deps].join(" "));
