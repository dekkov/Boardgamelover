import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Shared';
import { HomePage } from './pages/Home';
import { GameDetailPage } from './pages/GameDetail';
import { LobbyPage } from './pages/Lobby';
import { GameRoomPage } from './pages/GameRoom';
import { ProfilePage } from './pages/Profile';
import { GamesPage } from './pages/Games';
import { CommunityPage } from './pages/Community';
import { ForumThreadPage } from './pages/ForumThread';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/:gameId" element={<GameDetailPage />} />
            <Route path="/table/:tableId" element={<LobbyPage />} />
            <Route path="/table/:tableId/play" element={<GameRoomPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:postId" element={<ForumThreadPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#1e293b',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
