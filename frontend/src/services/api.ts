const BASE_URL = "https://loose-masks-repair.loca.lt/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private getHeaders(contentType: string | null = "application/json"): Headers {
    const headers = new Headers();
    if (contentType) {
      headers.append("Content-Type", contentType);
    }
    
    const token = localStorage.getItem("lexguard_access_token");
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Attempt token refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Token refreshed, request should be retried in user space,
          // but for simplicity we throw error and let frontend trigger reload.
          window.location.reload();
        } else {
          localStorage.removeItem("lexguard_access_token");
          localStorage.removeItem("lexguard_refresh_token");
          localStorage.removeItem("lexguard_user");
          if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
            window.location.href = "/login";
          }
        }
      }
      
      let errorMessage = "An error occurred";
      try {
        const errData = await response.json();
        errorMessage = errData.detail || errorMessage;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refresh = localStorage.getItem("lexguard_refresh_token");
    if (!refresh) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("lexguard_access_token", data.access_token);
        localStorage.setItem("lexguard_refresh_token", data.refresh_token);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  public async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let url = `${BASE_URL}${path}`;
    if (options.params) {
      const query = new URLSearchParams(options.params).toString();
      url += `?${query}`;
    }

    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: this.getHeaders()
    });

    return this.handleResponse<T>(response);
  }

  public async post<T>(path: string, body: any, options: RequestOptions = {}): Promise<T> {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      method: "POST",
      headers: this.getHeaders(isFormData ? null : "application/json"),
      body: isFormData ? body : JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  public async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      method: "DELETE",
      headers: this.getHeaders()
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
export { BASE_URL };
