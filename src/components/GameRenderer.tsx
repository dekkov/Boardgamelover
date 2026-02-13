import React, { useState, useEffect, Suspense } from 'react';
import { pluginLoader } from '../lib/pluginLoader';
import type { GameComponentProps } from '../types/plugin';

interface GameRendererProps extends GameComponentProps {
  gameId: string;
}

function GameLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 text-sm">Loading game...</p>
      </div>
    </div>
  );
}

function GameError({ error, gameId }: { error: string; gameId: string }) {
  return (
    <div className="flex items-center justify-center h-full text-center p-8">
      <div className="space-y-4">
        <div className="text-4xl">&#x26A0;</div>
        <h3 className="text-xl font-bold text-slate-800">Failed to load game</h3>
        <p className="text-slate-500 text-sm max-w-md">{error}</p>
        <p className="text-slate-400 text-xs">Game ID: {gameId}</p>
      </div>
    </div>
  );
}

class GameErrorBoundary extends React.Component<
  { children: React.ReactNode; gameId: string },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return <GameError error={this.state.error} gameId={this.props.gameId} />;
    }
    return this.props.children;
  }
}

export function GameRenderer(props: GameRendererProps) {
  const { gameId, ...gameProps } = props;
  const [GameComponent, setGameComponent] = useState<React.ComponentType<GameComponentProps> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGameComponent(null);
    setError(null);

    pluginLoader.loadFrontendPlugin(gameId)
      .then(plugin => setGameComponent(() => plugin.GameComponent))
      .catch(err => setError(err.message));
  }, [gameId]);

  if (error) return <GameError error={error} gameId={gameId} />;
  if (!GameComponent) return <GameLoading />;

  return (
    <GameErrorBoundary gameId={gameId}>
      <Suspense fallback={<GameLoading />}>
        <GameComponent {...gameProps} />
      </Suspense>
    </GameErrorBoundary>
  );
}
