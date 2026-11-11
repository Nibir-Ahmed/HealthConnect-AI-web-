// Lightweight offline SVG avatar generator - zero network requests or timeouts
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

export default getAvatarUrl;
