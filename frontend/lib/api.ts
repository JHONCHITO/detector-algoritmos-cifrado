// frontend/lib/api.ts
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
"https://wine-classifier-backend.onrender.com";
export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
  };

  return fetch(url, mergedOptions);
}

