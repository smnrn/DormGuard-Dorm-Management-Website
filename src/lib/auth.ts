import { authAPI, APIError } from './api';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'tenant' | 'helpdesk';
  full_name: string;
  email?: string;
  phone?: string;
}

// Store token and user data
export const setAuthData = (token: string, user: AuthUser) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Get stored user data
export const getAuthUser = (): AuthUser | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Get stored token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken() && !!getAuthUser();
};

// Clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Login function
export const login = async (
  username: string,
  password: string
): Promise<AuthUser> => {
  try {
    // Try to login without specifying role - backend will determine it
    const response = await authAPI.login(username, password);
    
    const user: AuthUser = {
      id: response.user.userId,  // Backend sends userId, not id
      username: response.user.username,
      role: response.user.role as 'admin' | 'tenant' | 'helpdesk',
      full_name: response.user.fullName,  // Backend sends fullName, not full_name
      email: response.user.email,
      phone: response.user.phone,
    };
    
    setAuthData(response.token, user);
    return user;
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(error.message);
    }
    throw new Error('Login failed. Please check your credentials and try again.');
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    await authAPI.logout();
  } catch (error) {
    // Even if logout API fails, clear local data
    console.error('Logout API error:', error);
  } finally {
    clearAuthData();
  }
};