import { create } from "zustand";
import { api } from "../services/api";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization_id: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from local storage
  const storedUser = localStorage.getItem("lexguard_user");
  const token = localStorage.getItem("lexguard_access_token");
  
  let initialUser: UserProfile | null = null;
  if (storedUser && token) {
    try {
      initialUser = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("lexguard_user");
    }
  }

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    isLoading: false,
    error: null,
    
    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post<any>("/auth/login", credentials);
        const userProfile: UserProfile = {
          name: response.name,
          email: credentials.email,
          role: response.role,
          organization_id: response.organization_id
        };
        
        localStorage.setItem("lexguard_access_token", response.access_token);
        localStorage.setItem("lexguard_refresh_token", response.refresh_token);
        localStorage.setItem("lexguard_user", JSON.stringify(userProfile));
        
        set({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (err: any) {
        set({
          error: err.message || "Login failed. Check your credentials.",
          isLoading: false
        });
        throw err;
      }
    },
    
    register: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post<any>("/auth/register", data);
        const userProfile: UserProfile = {
          name: response.name,
          email: data.email,
          role: response.role,
          organization_id: response.organization_id
        };
        
        localStorage.setItem("lexguard_access_token", response.access_token);
        localStorage.setItem("lexguard_refresh_token", response.refresh_token);
        localStorage.setItem("lexguard_user", JSON.stringify(userProfile));
        
        set({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (err: any) {
        set({
          error: err.message || "Registration failed. Email might already be taken.",
          isLoading: false
        });
        throw err;
      }
    },
    
    logout: () => {
      localStorage.removeItem("lexguard_access_token");
      localStorage.removeItem("lexguard_refresh_token");
      localStorage.removeItem("lexguard_user");
      set({
        user: null,
        isAuthenticated: false,
        error: null
      });
    },
    
    clearError: () => set({ error: null })
  };
});
