import { IS_MAC } from "$shared/platform";

const DIGEST = /^[0-9a-f]{64}$/;
const PROFILE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const base = IS_MAC ? "zephium-media://localhost/" : "http://zephium-media.localhost/";

/** Build the local, profile-bound media URL used by new-tab backgrounds. */
export function mediaUrl(profile: string, digest: string, width = 720): string | null {
  if (!DIGEST.test(digest) || !PROFILE.test(profile)) return null;
  return `${base}${profile}/${digest}?w=${width}`;
}
