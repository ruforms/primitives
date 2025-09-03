#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Get the published version of a package from npm registry
 * Falls back to workspace version if package is private/unpublished
 */
function getPackageVersion(packageName, workspaceVersion) {
  try {
    // Try to get published version from npm
    const publishedVersion = execSync(`npm view ${packageName} version`, { 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'] // Suppress stderr for cleaner output
    }).trim();
    
    console.log(`  📦 ${packageName}: found published v${publishedVersion}`);
    return `^${publishedVersion}`;
  } catch (error) {
    // Package is private, not published, or npm not authenticated
    console.log(`  🔒 ${packageName}: using workspace v${workspaceVersion} (private/unpublished)`);
    return `^${workspaceVersion}`;
  }
}

/**
 * Simple script to resolve workspace:* dependencies to actual versions
 * Run this before publishing to convert workspace deps to npm versions
 */
function resolveWorkspaceDependencies() {
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  let hasChanges = false;

  console.log('🔧 Resolving workspace:* dependencies...');

  const resolveSection = (deps) => {
    if (!deps) return;

    Object.entries(deps).forEach(([name, version]) => {
      if (version.startsWith('workspace:')) {
        // Look for the package in common monorepo locations
        const packageName = name.replace('@ruforms/', '');
        const possiblePaths = [
          `../${packageName}/package.json`,          // Same level
          `../../libs/${packageName}/package.json`, // From apps/ to libs/
          `../../apps/${packageName}/package.json`, // From libs/ to apps/
          `../libs/${packageName}/package.json`,    // From root to libs/
          `../apps/${packageName}/package.json`,    // From root to apps/
        ];

        for (const workspacePath of possiblePaths) {
          if (fs.existsSync(workspacePath)) {
            try {
              const workspacePackage = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
              // Use the new function to get the best version (published or workspace)
              const newVersion = getPackageVersion(name, workspacePackage.version);
              
              console.log(`  ✅ ${name}: workspace:* → ${newVersion}`);
              deps[name] = newVersion;
              hasChanges = true;
              return; // Found and resolved, move to next dependency
            } catch (error) {
              console.warn(`  ⚠️  Could not read ${workspacePath}`);
            }
          }
        }
        
        console.warn(`  ⚠️  Could not resolve workspace dependency: ${name}`);
      }
    });
  };

  // Resolve all dependency types
  resolveSection(packageJson.dependencies);
  resolveSection(packageJson.devDependencies);
  resolveSection(packageJson.peerDependencies);

  if (hasChanges) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Workspace dependencies resolved');
  } else {
    console.log('ℹ️  No workspace:* dependencies found');
  }
}

resolveWorkspaceDependencies();
