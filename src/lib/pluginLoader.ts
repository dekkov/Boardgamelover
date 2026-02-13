import type { BackendPlugin } from '../types/plugin'

const frontendCache = new Map<string, React.ComponentType<any>>()
const backendCache = new Map<string, BackendPlugin>()

export class PluginLoader {
  async loadFrontendPlugin(gameId: string): Promise<{ GameComponent: React.ComponentType<any> }> {
    if (frontendCache.has(gameId)) {
      return { GameComponent: frontendCache.get(gameId)! }
    }

    try {
      const module = await import(`../../games/${gameId}/Frontend.tsx`)
      const component = module.default || module.GameComponent
      frontendCache.set(gameId, component)
      return { GameComponent: component }
    } catch (err) {
      throw new Error(`Failed to load frontend for game "${gameId}": ${err}`)
    }
  }

  async loadBackendPlugin(gameId: string): Promise<BackendPlugin> {
    if (backendCache.has(gameId)) {
      return backendCache.get(gameId)!
    }

    try {
      const module = await import(`../../games/${gameId}/backend.ts`)
      const plugin: BackendPlugin = {
        createInitialState: module.createInitialState,
        validateMove: module.validateMove,
        applyMove: module.applyMove,
        checkWinCondition: module.checkWinCondition,
        getGameStatus: module.getGameStatus,
      }
      backendCache.set(gameId, plugin)
      return plugin
    } catch (err) {
      throw new Error(`Failed to load backend for game "${gameId}": ${err}`)
    }
  }
}

export const pluginLoader = new PluginLoader()
