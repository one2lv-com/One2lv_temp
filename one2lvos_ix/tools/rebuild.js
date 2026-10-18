import fs from "fs";
import path from "path";

const workspace = path.resolve(process.cwd(), "workspace");
const files = [
  { file: "jobs.json", content: "[]\n" },
  { file: "audit.log", content: "" },
  { file: "boot-state.json", content: JSON.stringify({
      lastBootAt: null,
      lastShutdownAt: null,
      cleanShutdown: true,
      bootCount: 0,
      recoveryMode: false,
      snapshots: []
    }, null, 2) + "\n"
  }
];

if (!fs.existsSync(workspace)) fs.mkdirSync(workspace, { recursive: true });

for (const item of files) {
  const p = path.join(workspace, item.file);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, item.content, "utf8");
    console.log(`[create] ${p}`);
  } else {
    console.log(`[keep] ${p}`);
  }
}

const snapshots = path.join(workspace, ".snapshots");
if (!fs.existsSync(snapshots)) {
  fs.mkdirSync(snapshots, { recursive: true });
  console.log(`[create] ${snapshots}`);
}
console.log("rebuild pass done");
