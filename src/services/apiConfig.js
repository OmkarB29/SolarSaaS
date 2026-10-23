export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

export const apiUrl = (path = '') => {
  const baseUrl = trimTrailingSlashes(API_BASE_URL);
  const normalizedPath = String(path).startsWith('/') ? String(path) : `/${path}`;

  if (!baseUrl) {
    return normalizedPath;
  }

  const baseIncludesApi = baseUrl.endsWith('/api');
  const pathStartsWithApi = normalizedPath === '/api' || normalizedPath.startsWith('/api/');

  if (baseIncludesApi && pathStartsWithApi) {
    return `${baseUrl}${normalizedPath.slice('/api'.length)}`;
  }

  return `${baseUrl}${normalizedPath}`;
};
