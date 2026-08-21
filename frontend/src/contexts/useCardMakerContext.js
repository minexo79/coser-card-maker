import { useContext } from 'react';
import { CardMakerContext } from './cardMakerContext';

export const useCardMakerContext = () => {
  const value = useContext(CardMakerContext);
  if (!value) {
    throw new Error('useCardMakerContext must be used within a CardMakerProvider.');
  }
  return value;
};