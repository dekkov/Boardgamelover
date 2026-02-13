import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { GameTable } from '../types'
import { findActiveTableForUser } from '../api/tables'

export function useActiveTable() {
  const [activeTable, setActiveTable] = useState<GameTable | undefined>(undefined)
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    const checkActiveTable = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const table = await findActiveTableForUser(user.id)
      if (!cancelled) {
        setActiveTable(table || undefined)
      }
    }

    checkActiveTable()

    // Re-check on route change
    return () => { cancelled = true }
  }, [location.pathname])

  return activeTable
}
