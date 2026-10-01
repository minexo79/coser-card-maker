import { useCardMaker } from '../hooks/useCardMaker';
import { CardMakerContext } from './cardMakerContext';

const CardMakerProvider = ({ eventId = null, children }) => {
  const value = useCardMaker({ eventId });
  return <CardMakerContext.Provider value={value}>{children}</CardMakerContext.Provider>;
};

export default CardMakerProvider;