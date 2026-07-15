'use client'

import { createContext, useContext, useMemo, useState } from 'react'

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

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function today() {
  return new Date().toISOString()
}

const seed: Vault[] = [
  {
    id: 'linear-algebra',
    name: 'Linear Algebra',
    updatedAt: '2026-07-08T10:00:00.000Z',
    masterNotes: [
      {
        id: 'la-vectors',
        vaultId: 'linear-algebra',
        title: 'Vectors & Vector Spaces',
        coverage: 82,
        generated: true,
        sources: [
          { id: 's1', name: 'Lecture 1 - Vectors.pdf', pages: 14 },
          { id: 's2', name: 'Textbook Ch.2.pdf', pages: 31 },
          { id: 's3', name: 'Tutorial Notes.pdf', pages: 8 },
        ],
        timeline: [
          { id: 't1', label: 'Definitions & notation', date: 'Week 1' },
          { id: 't2', label: 'Linear independence', date: 'Week 2' },
          { id: 't3', label: 'Basis & dimension', date: 'Week 3' },
        ],
        sections: [
          {
            id: 'sec1',
            heading: 'Vector Spaces',
            body: 'A vector space over a field F is a set V equipped with addition and scalar multiplication satisfying the eight axioms of closure, associativity, identity, and distributivity.',
          },
          {
            id: 'sec2',
            heading: 'Linear Independence',
            body: 'A set of vectors is linearly independent when no vector can be written as a linear combination of the others. Formally, the only solution to the homogeneous equation is trivial.',
          },
          {
            id: 'sec3',
            heading: 'Basis and Dimension',
            body: 'A basis is a linearly independent spanning set. The dimension of a vector space is the number of vectors in any basis, an invariant of the space.',
          },
        ],
      },
    ],
  },
  {
    id: 'organic-chem',
    name: 'Organic Chemistry',
    updatedAt: '2026-07-11T15:30:00.000Z',
    masterNotes: [
      {
        id: 'oc-reactions',
        vaultId: 'organic-chem',
        title: 'Reaction Mechanisms',
        coverage: 64,
        generated: true,
        sources: [
          { id: 's1', name: 'Mechanisms Handout.pdf', pages: 22 },
          { id: 's2', name: 'Scanned Notes.pdf', pages: 11 },
        ],
        timeline: [
          { id: 't1', label: 'Nucleophilic substitution', date: 'Module 1' },
          { id: 't2', label: 'Elimination reactions', date: 'Module 2' },
        ],
        sections: [
          {
            id: 'sec1',
            heading: 'Nucleophilic Substitution',
            body: 'SN1 proceeds via a carbocation intermediate with first-order kinetics, while SN2 is a concerted backside attack with second-order kinetics and inversion of configuration.',
          },
          {
            id: 'sec2',
            heading: 'Elimination',
            body: 'E1 and E2 pathways compete with substitution. Strong bulky bases and heat favor elimination, giving the more substituted (Zaitsev) alkene in most cases.',
          },
        ],
      },
    ],
  },
  {
    id: 'macroeconomics',
    name: 'Macroeconomics',
    updatedAt: '2026-06-29T09:15:00.000Z',
    masterNotes: [],
  },
]

type VaultContextValue = {
  vaults: Vault[]
  createVault: (name: string) => string
  renameVault: (id: string, name: string) => void
  deleteVault: (id: string) => void
  getVault: (id: string) => Vault | undefined
  getMasterNote: (id: string) => { note: MasterNote; vault: Vault } | undefined
  createMasterNote: (vaultId: string, title: string) => string
  renameMasterNote: (id: string, title: string) => void
  deleteMasterNote: (id: string) => void
  generateMasterNote: (id: string) => void
  addSource: (noteId: string, name: string) => void
}

const VaultContext = createContext<VaultContextValue | null>(null)

export function VaultStoreProvider({ children }: { children: React.ReactNode }) {
  const [vaults, setVaults] = useState<Vault[]>(seed)

  const value = useMemo<VaultContextValue>(() => {
    const touch = (v: Vault): Vault => ({ ...v, updatedAt: today() })

    return {
      vaults,
      createVault(name) {
        const id = uid('vault')
        setVaults((prev) => [
          { id, name, updatedAt: today(), masterNotes: [] },
          ...prev,
        ])
        return id
      },
      renameVault(id, name) {
        setVaults((prev) => prev.map((v) => (v.id === id ? touch({ ...v, name }) : v)))
      },
      deleteVault(id) {
        setVaults((prev) => prev.filter((v) => v.id !== id))
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
      createMasterNote(vaultId, title) {
        const id = uid('note')
        setVaults((prev) =>
          prev.map((v) =>
            v.id === vaultId
              ? touch({
                  ...v,
                  masterNotes: [
                    {
                      id,
                      vaultId,
                      title,
                      coverage: 0,
                      generated: false,
                      sources: [],
                      timeline: [],
                      sections: [],
                    },
                    ...v.masterNotes,
                  ],
                })
              : v,
          ),
        )
        return id
      },
      renameMasterNote(id, title) {
        setVaults((prev) =>
          prev.map((v) => ({
            ...v,
            masterNotes: v.masterNotes.map((n) => (n.id === id ? { ...n, title } : n)),
          })),
        )
      },
      deleteMasterNote(id) {
        setVaults((prev) =>
          prev.map((v) => ({
            ...v,
            masterNotes: v.masterNotes.filter((n) => n.id !== id),
          })),
        )
      },
      generateMasterNote(id) {
        setVaults((prev) =>
          prev.map((v) => ({
            ...v,
            masterNotes: v.masterNotes.map((n) =>
              n.id === id
                ? {
                    ...n,
                    generated: true,
                    coverage: Math.min(100, Math.max(n.coverage, 40 + n.sources.length * 15)),
                  }
                : n,
            ),
          })),
        )
      },
      addSource(noteId, name) {
        setVaults((prev) =>
          prev.map((v) => ({
            ...v,
            masterNotes: v.masterNotes.map((n) =>
              n.id === noteId
                ? {
                    ...n,
                    sources: [
                      ...n.sources,
                      { id: uid('src'), name, pages: Math.floor(Math.random() * 20) + 5 },
                    ],
                  }
                : n,
            ),
          })),
        )
      },
    }
  }, [vaults])

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVaults() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVaults must be used within VaultStoreProvider')
  return ctx
}
