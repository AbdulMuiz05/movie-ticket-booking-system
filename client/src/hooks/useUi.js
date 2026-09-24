import { useContext } from 'react';
import { UiContext } from '../context/UiContext.jsx';

export const useUi = () => {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
};