
import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Auth from './components/Auth';
import BingoRoom from './components/BingoRoom';
import AdminPanel from './components/AdminPanel';

const AppContent: React.FC = () => {
  const { user } = useGame();

  if (!user) {
    return <Auth />;
  }

  if (user.isAdmin) {
    return <AdminPanel />;
  }

  return <BingoRoom />;
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
