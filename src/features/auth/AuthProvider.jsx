import { useCallback, useMemo, useState } from 'react';
import {
  getCurrentSession,
  signIn as authenticate,
  signOut as clearSession,
  signUp as createAccount,
} from './authService';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentSession);

  const signUp = useCallback((input) => {
    const result = createAccount(input);

    if (result.success) {
      setUser(result.user);
    }

    return result;
  }, []);

  const signIn = useCallback((input) => {
    const result = authenticate(input);

    if (result.success) {
      setUser(result.user);
    }

    return result;
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    signIn,
    signOut,
    signUp,
  }), [signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
