export const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

export function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

export function getBasePath() {
  const pathParts = window.location.pathname.split('/');
  const isGitHub = window.location.hostname.includes('github.io');
  if (isGitHub) {
    const repoName = pathParts[1];
    return `/${repoName}/`;
  }
  return '/';
}

export function getMisionURL(relativePath) {
  const base = getBasePath();
  let cleanPath = relativePath.replace(/^(\.\/|\.\.\/)+/, '');
  if (!cleanPath.startsWith('misiones/')) cleanPath = 'misiones/' + cleanPath;
  const fileMatch = cleanPath.match(/(mision\d+)\.html$/i);
  if (fileMatch) {
    const folderName = fileMatch[1];
    if (!cleanPath.includes(`/${folderName}/`))
      cleanPath = cleanPath.replace(`${folderName}.html`, `${folderName}/${folderName}.html`);
  }
  return `${base}${cleanPath}`.replace(/([^:]\/)\/+/g, '$1');
}
