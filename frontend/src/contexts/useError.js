import { useContext } from 'react';
import { ErrorContext } from './ErrorContext';

export const useError = () => {
  const value = useContext(ErrorContext);
  if (!value) {
    throw new Error('useError must be used within an ErrorProvider.');
  }
  return value;
};
