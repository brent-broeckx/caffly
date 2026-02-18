export function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return "http://localhost:4000";
}

export function buildGithubSignInUrl(params: {
  apiBaseUrl: string;
  callbackUrl: string;
}): string {
  const base = params.apiBaseUrl.replace(/\/$/, "");
  const callback = encodeURIComponent(params.callbackUrl);

  return `${base}/auth/signin?callbackUrl=${callback}`;
}
