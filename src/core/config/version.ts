import packageJson from '../../../package.json';

type PackageMeta = {
  version: string;
  buildNumber?: number;
};

const pkg = packageJson as PackageMeta;

/** Marketing version (semver) — synced to iOS/Android by `npm run version:bump` */
export const APP_VERSION = pkg.version;

/** Store build number — versionCode / CURRENT_PROJECT_VERSION */
export const APP_BUILD = Number(pkg.buildNumber ?? 1);

/** e.g. "1.0.0 (1)" */
export const APP_VERSION_FULL = `${APP_VERSION} (${APP_BUILD})`;

/** e.g. "Versión 1.0.0 · Build 1" */
export const APP_VERSION_LABEL = `Versión ${APP_VERSION} · Build ${APP_BUILD}`;
