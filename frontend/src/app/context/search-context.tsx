"use client"

import type React from "react"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Plant {
  id: number
  nome: string
  familia: string
  nomeCientifico: string
  localColheita: string
  numeroExcicata: string
  parteUsada: string
  metodoPreparacao: string
  usos: string
  metodoExtracao: string
  composicaoQuimica: string
  propriedadesFarmacologicas: string
  afiliacao: string
  referencia: string
}

interface SearchFilters {
  popularName: string
  scientificName: string
  traditionalUse: string
  author: string
  observationLocation: string
}

interface SearchContextType {
  filters: SearchFilters
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>
  results: Plant[]
  isLoading: boolean
  hasSearched: boolean
  performSearch: () => void
  clearSearch: () => void
}

// Dados simulados para demonstração
const mockPlants: Plant[] = [
  {
    id: 1,
    nome: "Carqueja",
    familia: "ASTERACEAE (COMPOSITAE)",
    nomeCientifico: "Baccharis crispa Spreng.",
    localColheita: "Cerrado, Minas Gerais",
    numeroExcicata: "BHCB 42356",
    parteUsada: "Folhas e caules",
    metodoPreparacao: "Infusão ou decocção",
    usos: "Problemas digestivos, diabetes, obesidade",
    metodoExtracao: "Extração hidroalcoólica",
    composicaoQuimica: "Flavonóides, terpenos, taninos",
    propriedadesFarmacologicas: "Anti-inflamatória, antioxidante, hipoglicemiante",
    afiliacao: "Universidade Federal de Minas Gerais",
    referencia: "Silva et al. (2018). Journal of Ethnopharmacology, 220: 65-75",
  },
  {
    id: 2,
    nome: "Carqueja folhuda",
    familia: "ASTERACEAE (COMPOSITAE)",
    nomeCientifico: "Baccharis tridentata Vahl",
    localColheita: "Campos de altitude, Minas Gerais",
    numeroExcicata: "BHCB 38921",
    parteUsada: "Folhas",
    metodoPreparacao: "Infusão",
    usos: "Problemas hepáticos, digestivos",
    metodoExtracao: "Extração hidroalcoólica",
    composicaoQuimica: "Flavonóides, diterpenos, ácidos fenólicos",
    propriedadesFarmacologicas: "Hepatoprotetora, digestiva",
    afiliacao: "Universidade Federal de Minas Gerais",
    referencia: "Oliveira et al. (2019). Revista Brasileira de Plantas Medicinais, 21(3): 298-307",
  },
  {
    id: 3,
    nome: "Aroeira",
    familia: "ANACARDIACEAE",
    nomeCientifico: "Schinus terebinthifolia Raddi",
    localColheita: "Mata Atlântica, Espírito Santo",
    numeroExcicata: "BHCB 51432",
    parteUsada: "Cascas e folhas",
    metodoPreparacao: "Decocção, tintura",
    usos: "Anti-inflamatório, cicatrizante, antimicrobiano",
    metodoExtracao: "Extração hidroalcoólica e aquosa",
    composicaoQuimica: "Taninos, óleos essenciais, flavonóides",
    propriedadesFarmacologicas: "Anti-inflamatória, antimicrobiana, cicatrizante",
    afiliacao: "Universidade Federal do Espírito Santo",
    referencia: "Santos et al. (2020). Journal of Ethnopharmacology, 240: 111891",
  },
]

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>({
    popularName: "",
    scientificName: "",
    traditionalUse: "",
    author: "",
    observationLocation: "",
  })
  const [results, setResults] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const performSearch = () => {
    setIsLoading(true)
    setHasSearched(true)

    // Simulando uma chamada de API
    setTimeout(() => {
      const filteredResults = mockPlants.filter((plant) => {
        const matchesPopularName =
          !filters.popularName || plant.nome.toLowerCase().includes(filters.popularName.toLowerCase())
        const matchesScientificName =
          !filters.scientificName || plant.nomeCientifico.toLowerCase().includes(filters.scientificName.toLowerCase())
        const matchesTraditionalUse =
          !filters.traditionalUse || plant.usos.toLowerCase().includes(filters.traditionalUse.toLowerCase())
        const matchesAuthor = !filters.author || plant.referencia.toLowerCase().includes(filters.author.toLowerCase())
        const matchesLocation =
          !filters.observationLocation ||
          plant.localColheita.toLowerCase().includes(filters.observationLocation.toLowerCase())

        return matchesPopularName && matchesScientificName && matchesTraditionalUse && matchesAuthor && matchesLocation
      })

      setResults(filteredResults)
      setIsLoading(false)
    }, 1500)
  }

  const clearSearch = () => {
    setFilters({
      popularName: "",
      scientificName: "",
      traditionalUse: "",
      author: "",
      observationLocation: "",
    })
    setResults([])
    setHasSearched(false)
  }

  return (
    <SearchContext.Provider
      value={{
        filters,
        setFilters,
        results,
        isLoading,
        hasSearched,
        performSearch,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
