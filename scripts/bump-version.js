#!/usr/bin/env node
/**
 * Bumps app version (patch) + build, then syncs to iOS and Android.
 *
 *   node scripts/bump-version.js           → patch +1, build +1, sync natives
 *   node scripts/bump-version.js --sync    → only write package → iOS/Android
 *   node scripts/bump-version.js --minor   → minor +1, patch=0, build +1
 *   node scripts/bump-version.js --major   → major +1, minor=0, patch=0, build +1
 *
 * Source of truth: package.json → version + buildNumber
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const LOCK_PATH = path.join(ROOT, 'package-lock.json');
const ANDROID_GRADLE = path.join(ROOT, 'android/app/build.gradle');
const IOS_PBXPROJ = path.join(
  ROOT,
  'ios/MemoraBook.xcodeproj/project.pbxproj',
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version).trim());
  if (!match) {
    throw new Error(
      `Invalid semver "${version}". Expected MAJOR.MINOR.PATCH (e.g. 1.0.0)`,
    );
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpSemver(version, kind) {
  const parts = parseSemver(version);
  if (kind === 'major') {
    parts.major += 1;
    parts.minor = 0;
    parts.patch = 0;
  } else if (kind === 'minor') {
    parts.minor += 1;
    parts.patch = 0;
  } else {
    parts.patch += 1;
  }
  return formatSemver(parts);
}

function replaceAll(content, pattern, replacement, label) {
  if (!pattern.test(content)) {
    throw new Error(`Could not update ${label} (pattern not found)`);
  }
  // Reset lastIndex when pattern uses /g (test() advances it)
  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
}

function syncAndroid(versionName, versionCode) {
  let gradle = fs.readFileSync(ANDROID_GRADLE, 'utf8');
  gradle = replaceAll(
    gradle,
    /versionCode\s+\d+/,
    `versionCode ${versionCode}`,
    'android versionCode',
  );
  gradle = replaceAll(
    gradle,
    /versionName\s+"[^"]*"/,
    `versionName "${versionName}"`,
    'android versionName',
  );
  fs.writeFileSync(ANDROID_GRADLE, gradle);
}

function syncIos(marketingVersion, buildNumber) {
  let pbx = fs.readFileSync(IOS_PBXPROJ, 'utf8');
  const marketingMatches = pbx.match(/MARKETING_VERSION = [^;]+;/g) || [];
  const buildMatches = pbx.match(/CURRENT_PROJECT_VERSION = [^;]+;/g) || [];
  if (marketingMatches.length === 0 || buildMatches.length === 0) {
    throw new Error('Could not find MARKETING_VERSION / CURRENT_PROJECT_VERSION in pbxproj');
  }
  pbx = pbx.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${marketingVersion};`,
  );
  pbx = pbx.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${buildNumber};`,
  );
  fs.writeFileSync(IOS_PBXPROJ, pbx);
}

function syncPackageLock(version) {
  if (!fs.existsSync(LOCK_PATH)) return;
  const lock = readJson(LOCK_PATH);
  lock.version = version;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = version;
  }
  writeJson(LOCK_PATH, lock);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const syncOnly = args.has('--sync') || args.has('--sync-only');
  const kind = args.has('--major') ? 'major' : args.has('--minor') ? 'minor' : 'patch';

  const pkg = readJson(PKG_PATH);
  const prevVersion = String(pkg.version);
  // Normalize short versions like "1.0" → "1.0.0"
  const normalized = (() => {
    try {
      return formatSemver(parseSemver(prevVersion));
    } catch {
      const short = /^(\d+)\.(\d+)$/.exec(prevVersion);
      if (short) return `${short[1]}.${short[2]}.0`;
      throw new Error(`Invalid package.json version: ${prevVersion}`);
    }
  })();

  const prevBuild = Number(pkg.buildNumber ?? 1);
  if (!Number.isInteger(prevBuild) || prevBuild < 1) {
    throw new Error(`Invalid buildNumber: ${pkg.buildNumber}`);
  }

  const nextVersion = syncOnly ? normalized : bumpSemver(normalized, kind);
  const nextBuild = syncOnly ? prevBuild : prevBuild + 1;

  pkg.version = nextVersion;
  pkg.buildNumber = nextBuild;
  writeJson(PKG_PATH, pkg);
  syncPackageLock(nextVersion);
  syncAndroid(nextVersion, nextBuild);
  syncIos(nextVersion, nextBuild);

  const action = syncOnly ? 'synced' : `bumped (${kind})`;
  console.log(
    `[version] ${action}: ${prevVersion} (${prevBuild}) → ${nextVersion} (${nextBuild})`,
  );
  console.log('  ✓ package.json');
  console.log('  ✓ android/app/build.gradle');
  console.log('  ✓ ios/.../project.pbxproj');
}

main();
