interface AuthError {
  message: string;
  code: string;
}

interface AuthContext {
  error: AuthError;
}

interface AuthCallbacks {
  onRequest?: () => void;
  onSuccess?: () => void;
  onError?: (ctx: AuthContext) => void;
}

interface AuthResponse<T = unknown> {
  data?: T;
  error?: AuthError;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  image?: string;
}

interface SignInData {
  email: string;
  password: string;
}

class AuthClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  signUp = {
    email: async (
      data: SignUpData,
      callbacks?: AuthCallbacks,
    ): Promise<AuthResponse> => {
      try {
        callbacks?.onRequest?.();
        const response = await fetch(`${this.baseUrl}/auth/signup`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          const error = {
            message: result.message || "Signup failed",
            code: response.status.toString(),
          };
          callbacks?.onError?.({ error });
          return { error };
        }

        callbacks?.onSuccess?.();
        return { data: result };
      } catch (error) {
        const authError = { message: "Network error", code: "NETWORK_ERROR" };
        callbacks?.onError?.({ error: authError });
        return { error: authError };
      }
    },
  };

  signIn = {
    email: async (
      data: SignInData,
      callbacks?: AuthCallbacks,
    ): Promise<AuthResponse> => {
      try {
        callbacks?.onRequest?.();
        const response = await fetch(`${this.baseUrl}/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          const error = {
            message: result.message || "Login failed",
            code: response.status.toString(),
          };
          callbacks?.onError?.({ error });
          return { error };
        }

        callbacks?.onSuccess?.();
        return { data: result };
      } catch (error) {
        const authError = { message: "Network error", code: "NETWORK_ERROR" };
        callbacks?.onError?.({ error: authError });
        return { error: authError };
      }
    },
  };
}

// Create and export the auth client instance
export const authClient = new AuthClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
);
