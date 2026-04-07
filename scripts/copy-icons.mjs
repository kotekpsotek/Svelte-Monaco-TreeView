import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const sourceDir = path.join(workspaceRoot, "icons");
const srcTreeDir = path.join(workspaceRoot, "src", "lib", "tree");
const distDir = path.join(workspaceRoot, "dist");
const staticDir = path.join(workspaceRoot, "static");
const distTargetDir = path.join(distDir, "icons");
const staticTargetDir = path.join(staticDir, "icons");
const srcTreeTargetDir = path.join(srcTreeDir, "icons");
const distTreeTargetDir = path.join(distDir, "tree", "icons");

const copyIconsTo = (targetDir) => {
	mkdirSync(path.dirname(targetDir), { recursive: true });
	rmSync(targetDir, { recursive: true, force: true });
	cpSync(sourceDir, targetDir, { recursive: true });
	console.log(`Copied icons: ${sourceDir} -> ${targetDir}`);
};

if (!existsSync(sourceDir)) {
	throw new Error(`Icons source folder not found: ${sourceDir}`);
}

mkdirSync(distDir, { recursive: true });
mkdirSync(staticDir, { recursive: true });
mkdirSync(srcTreeDir, { recursive: true });

copyIconsTo(distTargetDir);
copyIconsTo(staticTargetDir);
copyIconsTo(srcTreeTargetDir);
copyIconsTo(distTreeTargetDir);
