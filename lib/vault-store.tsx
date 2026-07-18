'use client'

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { createClient } from './supabase/client'

function formatSupabaseError(error: any): Error {
  if (!error) return new Error('Unknown database error')
  console.error("Supabase Error:", error)
  console.error("Code:", error.code)
  console.error("Message:", error.message)
  console.error("Details:", error.details)
  console.error("Hint:", error.hint)
  console.error("Status:", error.status)

  const detailLines = [
    error.message ? `Message: ${error.message}` : 'Database error occurred',
    error.code ? `Code: ${error.code}` : '',
    error.details ? `Details: ${error.details}` : '',
    error.hint ? `Hint: ${error.hint}` : '',
    error.status ? `Status: ${error.status}` : ''
  ].filter(Boolean)

  const err = new Error(detailLines.join('\n'))
  Object.assign(err, {
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status
  })
  return err
}

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
  sections: { id: string; heading: string; body: string; ocrSource?: string }[]
  compilationReport?: {
    id: string
    createdAt: string
    aiProvider: string
    aiModel: string
    ocrProvider: string
    duration: number
    duplicatesRemoved: number
    pagesProcessed: number
    warnings: string[]
  } | null
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
  deleteDocument: (id: string) => Promise<void>
  renameDocument: (id: string, name: string) => Promise<void>
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
            compilation_reports (
              id,
              created_at,
              ai_provider,
              ai_model,
              ocr_provider,
              compile_duration,
              input_tokens,
              output_tokens,
              duplicates_removed,
              pages_processed,
              warnings,
              errors
            ),
            note_sections (
              id,
              heading,
              body,
              display_order,
              ocr_source
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
              ocrSource: s.ocr_source,
            }))

          const timeline = (n.note_sections || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((s: any, idx: number) => ({
              id: s.id,
              label: s.heading,
              date: `Chapter ${idx + 1}`,
            }))

          const reports = n.compilation_reports || []
          const latestReport = reports.length > 0 ? reports[0] : null

          return {
            id: n.id,
            vaultId: n.vault_id,
            title: n.title,
            coverage: n.coverage,
            generated: n.generated,
            sources,
            sections,
            timeline,
            compilationReport: latestReport ? {
              id: latestReport.id,
              createdAt: latestReport.created_at,
              aiProvider: latestReport.ai_provider,
              aiModel: latestReport.ai_model,
              ocrProvider: latestReport.ocr_provider,
              duration: latestReport.compile_duration,
              duplicatesRemoved: latestReport.duplicates_removed,
              pagesProcessed: latestReport.pages_processed,
              warnings: latestReport.warnings || [],
            } : null,
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

        const payload = {
          name,
          owner_id: user.id
        };

        const { data, error } = await supabase
          .from('vaults')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error('[createVault] Insert failed:', error)
          throw formatSupabaseError(error)
        }

        await fetchVaults()
        return data?.id || 'temp-id'
      },
      async renameVault(id, name) {
        const { error } = await supabase.from('vaults').update({ name }).eq('id', id)
        if (error) throw formatSupabaseError(error)
        await fetchVaults()
      },
      async deleteVault(id) {
        const { error } = await supabase.from('vaults').delete().eq('id', id)
        if (error) throw formatSupabaseError(error)
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

        if (error) {
          console.error('[createMasterNote] Insert failed:', error)
          throw formatSupabaseError(error)
        }

        await fetchVaults()
        return data.id
      },
      async renameMasterNote(id, title) {
        const { error } = await supabase.from('master_notes').update({ title }).eq('id', id)
        if (error) throw formatSupabaseError(error)
        await fetchVaults()
      },
      async deleteMasterNote(id) {
        const { error } = await supabase.from('master_notes').delete().eq('id', id)
        if (error) throw formatSupabaseError(error)
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
      async deleteDocument(id) {
        const { error } = await supabase.from('documents').delete().eq('id', id)
        if (error) throw formatSupabaseError(error)
        await fetchVaults()
      },
      async renameDocument(id, name) {
        const { error } = await supabase.from('documents').update({ name }).eq('id', id)
        if (error) throw formatSupabaseError(error)
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
