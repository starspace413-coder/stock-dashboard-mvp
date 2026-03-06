// For GitHub Pages demo we call public APIs directly from the browser.
// If you deploy the FastAPI backend, you can override this via NEXT_PUBLIC_API_BASE_URL.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || url}`);
  }
  return res.json() as Promise<T>;
}
