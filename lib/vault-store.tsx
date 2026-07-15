'use client'

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { createClient } from './supabase/client'

export type SourcePdf = { id: string; name: string; pages: number }

export type TimelineEntry = { id: string; label: string; date: string }

export type MasterNote = {
  id: string
  vaultId: string
  title: string
  coverage: number
  generated: boolean
  sources: SourcePdf[]
  timeline: TimelineEntry[]
  sections: { id: string; heading: string; body: string }[]
}

export type Vault = {
  id: string
  name: string
  updatedAt: string
  masterNotes: MasterNote[]
}

type VaultContextValue = {
  vaults: Vault[]
  loading: boolean
  fetchVaults: () => Promise<void>
  createVault: (name: string) => Promise<string>
  renameVault: (id: string, name: string) => Promise<void>
  deleteVault: (id: string) => Promise<void>
  getVault: (id: string) => Vault | undefined
  getMasterNote: (id: string) => { note: MasterNote; vault: Vault } | undefined
  createMasterNote: (vaultId: string, title: string) => Promise<string>
  renameMasterNote: (id: string, title: string) => Promise<void>
  deleteMasterNote: (id: string) => Promise<void>
  generateMasterNote: (id: string) => Promise<void>
  addSource: (noteId: string, name: string) => void
}

const VaultContext = createContext<VaultContextValue | null>(null)

export function VaultStoreProvider({ children }: { children: React.ReactNode }) {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchVaults = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setVaults([])
        setLoading(false)
        return
      }

      // Fetch vaults owner and member relations
      const { data: vaultsData, error: vaultsError } = await supabase
        .from('vaults')
        .select(`
          id,
          name,
          updated_at,
          master_notes (
            id,
            vault_id,
            title,
            coverage,
            generated,
            version,
            ai_model,
            ocr_provider,
            source_document_hashes,
            note_sections (
              id,
              heading,
              body,
              display_order
            )
          )
        `)
        .order('updated_at', { ascending: false })

      if (vaultsError) throw vaultsError

      // Fetch documents in these vaults
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id, name, page_count, vault_id')

      if (docsError) throw docsError

      const mapped = (vaultsData || []).map((v: any) => {
        const vDocs = (docsData || []).filter((d: any) => d.vault_id === v.id)
        const vNotes = (v.master_notes || []).map((n: any) => {
          const sources = vDocs.map((d: any) => ({
            id: d.id,
            name: d.name,
            pages: d.page_count || 0,
          }))

          const sections = (n.note_sections || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((s: any) => ({
              id: s.id,
              heading: s.heading,
              body: s.body,
            }))

          const timeline = (n.note_sections || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((s: any, idx: number) => ({
              id: s.id,
              label: s.heading,
              date: `Chapter ${idx + 1}`,
            }))

          return {
            id: n.id,
            vaultId: n.vault_id,
            title: n.title,
            coverage: n.coverage,
            generated: n.generated,
            sources,
            sections,
            timeline,
          }
        })

        return {
          id: v.id,
          name: v.name,
          updatedAt: v.updated_at,
          masterNotes: vNotes,
        }
      })

      setVaults(mapped)
    } catch (err) {
      console.error('Error fetching vaults:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchVaults()

    // Setup real-time listener subscription
    const channel = supabase
      .channel('schema-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchVaults()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchVaults, supabase])

  const value = useMemo<VaultContextValue>(() => {
    return {
      vaults,
      loading,
      fetchVaults,
      async createVault(name) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthenticated')

        const { data, error } = await supabase
          .from('vaults')
          .insert({ name, owner_id: user.id })
          .select()
          .single()

        if (error) throw error
        await fetchVaults()
        return data.id
      },
      async renameVault(id, name) {
        const { error } = await supabase.from('vaults').update({ name }).eq('id', id)
        if (error) throw error
        await fetchVaults()
      },
      async deleteVault(id) {
        const { error } = await supabase.from('vaults').delete().eq('id', id)
        if (error) throw error
        await fetchVaults()
      },
      getVault(id) {
        return vaults.find((v) => v.id === id)
      },
      getMasterNote(id) {
        for (const vault of vaults) {
          const note = vault.masterNotes.find((n) => n.id === id)
          if (note) return { note, vault }
        }
        return undefined
      },
      async createMasterNote(vaultId, title) {
        const { data, error } = await supabase
          .from('master_notes')
          .insert({ vault_id: vaultId, title })
          .select()
          .single()

        if (error) throw error
        await fetchVaults()
        return data.id
      },
      async renameMasterNote(id, title) {
        const { error } = await supabase.from('master_notes').update({ title }).eq('id', id)
        if (error) throw error
        await fetchVaults()
      },
      async deleteMasterNote(id) {
        const { error } = await supabase.from('master_notes').delete().eq('id', id)
        if (error) throw error
        await fetchVaults()
      },
      async generateMasterNote(id) {
        const res = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ masterNoteId: id }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || 'Compilation failed to queue')
        }
        await fetchVaults()
      },
      addSource(noteId, name) {
        // Obsoleted by direct binary file API uploader in master/[id]/page.tsx
      },
    }
  }, [vaults, loading, fetchVaults, supabase])

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVaults() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVaults must be used within VaultStoreProvider')
  return ctx
}
