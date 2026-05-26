const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && accessToken) {
    const refresh = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (refresh.ok) {
      const data = await refresh.json();
      localStorage.setItem("accessToken", data.accessToken);
      headers.set("Authorization", `Bearer ${data.accessToken}`);
      return fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
    }
  }

  return response;
};

export const apiJson = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }
  return response.json() as Promise<T>;
};
