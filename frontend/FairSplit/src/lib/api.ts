const apiBase = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = path.startsWith("/api") ? `${apiBase}${path}` : `${apiBase}/api${path}`;
  
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("access_token");
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  let response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized by trying to refresh the token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken && path !== "/auth/login/" && path !== "/auth/refresh/") {
      try {
        const refreshResponse = await fetch(`${apiBase}/api/auth/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.access;
          localStorage.setItem("access_token", newAccessToken);
          
          // Retry the request with the new token
          headers.set("Authorization", `Bearer ${newAccessToken}`);
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Refresh token is expired/invalid: log out
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/auth";
        }
      } catch (err) {
        console.error("Error refreshing token:", err);
      }
    }
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
