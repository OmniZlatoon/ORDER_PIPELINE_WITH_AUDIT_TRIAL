import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  clearCustomerSession,
  getActiveCustomerSession,
  loginWithCredentials,
  signupCustomer,
} from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getActiveCustomerSession());

  const login = useCallback(async ({ email, password }) => {
    const result = await loginWithCredentials({ email, password });
    if (result.role === 'CUSTOMER' && result.user) {
      setCurrentUser(result.user);
    }
    return result;
  }, []);

  const signup = useCallback(async ({ fullName, email, password }) => {
    const createdUser = await signupCustomer({ fullName, email, password });
    setCurrentUser(createdUser);
    return createdUser;
  }, []);

  const logout = useCallback(() => {
    clearCustomerSession();
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      login,
      signup,
      logout,
    }),
    [currentUser, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
