import { useCardMaker } from '../hooks/useCardMaker';
import { CardMakerContext } from './cardMakerContext';

const CardMakerProvider = ({ eventName = null, children }) => {
  const value = useCardMaker({ eventName });
  return <CardMakerContext.Provider value={value}>{children}</CardMakerContext.Provider>;
};

export default CardMakerProvider;