const fs = require('fs');
const path = require('path');
const roots = [
  { name: 'frontend', dir: path.resolve('frontend/src'), alias: '@/' },
  { name: 'backend', dir: path.resolve('src'), alias: null },
];
const exts = ['.ts', '.tsx', '.js', '.jsx'];
const files = [];
for (const { dir } of roots) {
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const entry of fs.readdirSync(d)) {
      const p = path.join(d, entry);
      const st = fs.statSync(p);
      if (st.isDirectory()) stack.push(p);
      else if (exts.includes(path.extname(p))) files.push(p);
    }
  }
}
const map = new Map();
const re = /(?:import|export)\s+[^'"`]*from\s+['"]([^'"`]+)['"]|require\(['"]([^'"`]+)['"]\)/g;
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const im = [];
  let m;
  while ((m = re.exec(text))) im.push(m[1] || m[2]);
  map.set(f, im);
}
function resolve(root, file, spec) {
  if (root.alias && spec.startsWith(root.alias)) {
    const b = path.join(root.dir, spec.slice(root.alias.length));
    const r = resolveExt(b);
    if (r) return r;
  }
  if (spec.startsWith('.')) {
    const b = path.join(path.dirname(file), spec);
    const r = resolveExt(b);
    if (r) return r;
  }
  return null;
}
function resolveExt(b) {
  if (fs.existsSync(b) && fs.statSync(b).isFile()) return b;
  for (const e of exts) {
    if (fs.existsSync(b + e)) return b + e;
  }
  for (const e of exts) {
    const p = path.join(b, 'index' + e);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
const inbound = new Map();
for (const f of map.keys()) inbound.set(f, 0);
const unresolved = [];
for (const [file, ims] of map.entries()) {
  const root = roots.find(r => file.startsWith(r.dir));
  for (const s of ims) {
    const tgt = root ? resolve(root, file, s) : null;
    if (tgt && inbound.has(tgt)) inbound.set(tgt, inbound.get(tgt) + 1);
    else if (s.startsWith('.') || (root && s.startsWith(root.alias))) unresolved.push({ from: file, spec: s });
  }
}
const rel = p => path.relative(process.cwd(), p);
const zero = [...inbound.entries()].filter(([, c]) => c === 0).map(([f]) => rel(f)).sort();
console.log('=== zero inbound ===');
zero.forEach(f => console.log(f));
console.log('\n=== unresolved ===');
unresolved.forEach(u => console.log(`${rel(u.from)} -> ${u.spec}`));
