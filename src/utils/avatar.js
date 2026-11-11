// Lightweight offline SVG avatar generator - zero network requests or timeouts
import blogCover from '../assets/Images/blog_cover.jpg';

export const DEFAULT_BLOG_COVER = blogCover;

export const getAvatarUrl = (name = 'User', bg = '2A9D8F') => {
  const initial = (name.charAt(0) || 'U').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="100%" height="100%" fill="%23${bg}" rx="64"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="54" font-weight="700" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

export const getBlogImageUrl = (category = 'Health') => {
  const colors = {
    Cardiology: '1E7A6E',
    'General Health': '2A9D8F',
    Dermatology: '3AB8A8',
    Pediatrics: 'F59E0B',
  };
  const bg = colors[category] || '2A9D8F';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23${bg}"/><stop offset="100%" stop-color="%231A1D26"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="%23FFFFFF">${category} Health Guide</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

// Two-letter initials avatar (e.g. "Dr. Karim Ahmed" -> "KA"), generated locally
const PALETTE = ['#2A9D8F', '#1E7A6E', '#264653', '#E76F51', '#3A86FF', '#6D597A', '#F4A261'];

function getInitials(name) {
  const clean = String(name || 'User').replace(/^(dr\.?|doctor)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickColor(name) {
  let hash = 0;
  const str = String(name || 'User');
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function avatarFor(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="${pickColor(name)}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="50" font-weight="600" fill="#ffffff">${getInitials(name)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const REMOTE_PLACEHOLDER =
  /^https?:\/\/(ui-avatars\.com|images\.unsplash\.com|i\.pravatar\.cc|randomuser\.me|picsum\.photos|via\.placeholder\.com)/i;

export function isRemotePlaceholder(url) {
  return typeof url === 'string' && REMOTE_PLACEHOLDER.test(url);
}

// Keep real uploaded photos; replace empty or third-party placeholder links with local initials
export function resolveAvatar(url, name) {
  if (url && !isRemotePlaceholder(url)) return url;
  return avatarFor(name);
}

// Keep real uploaded covers; replace empty or third-party placeholder links with the bundled cover
export function resolveCover(url) {
  if (url && !isRemotePlaceholder(url)) return url;
  return DEFAULT_BLOG_COVER;
}

export default getAvatarUrl;
