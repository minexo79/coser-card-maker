import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return value;
};
