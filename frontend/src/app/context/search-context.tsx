"use client"

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"

// Manter a interface Plant original mas adaptar para a API
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

// Interfaces da API Flask para conversão interna
interface ApiPlant {
  id_planta: number
  nome_cientifico: string
  nome_comum?: string
  numero_exsicata?: string
  referencia?: string
  id_familia: number
  familia: string
  // Campos relacionais
  autores?: Array<{ id_autor: number; nome_autor: string; afiliacao?: string }>
  locais?: Array<{ id_local: number; provincia?: string; regiao?: string }>
  usos?: Array<{ 
    id_uso: number
    parte_usada?: string
    indicacao_uso?: string
    metodo_preparacao_tradicional?: string
    metodo_extraccao?: string
  }>
  propriedades?: Array<{ id_propriedade: number; descricao?: string }>
  compostos?: Array<{ id_composto: number; nome_composto?: string }>
}

interface Familia {
  id_familia: number
  nome_familia: string
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

const SearchContext = createContext<SearchContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Função para converter dados da API para o formato esperado pelo frontend
function convertApiPlantToFrontend(apiPlant: ApiPlant): Plant {
  // Extrair informações dos arrays relacionais
  const autoresStr = apiPlant.autores?.map(a => `${a.nome_autor}${a.afiliacao ? ` (${a.afiliacao})` : ''}`).join(', ') || ''
  const locaisStr = apiPlant.locais?.map(l => {
    const parts = [l.regiao, l.provincia].filter(Boolean)
    return parts.join(', ')
  }).join('; ') || ''
  const usosStr = apiPlant.usos?.map(u => u.indicacao_uso).filter(Boolean).join('; ') || ''
  const partesUsadasStr = apiPlant.usos?.map(u => u.parte_usada).filter(Boolean).join(', ') || ''
  const metodosPreparacaoStr = apiPlant.usos?.map(u => u.metodo_preparacao_tradicional).filter(Boolean).join('; ') || ''
  const metodosExtracaoStr = apiPlant.usos?.map(u => u.metodo_extraccao).filter(Boolean).join('; ') || ''
  const propriedadesStr = apiPlant.propriedades?.map(p => p.descricao).filter(Boolean).join('; ') || ''
  const compostosStr = apiPlant.compostos?.map(c => c.nome_composto).filter(Boolean).join(', ') || ''
  
  // Extrair afiliação do primeiro autor (para compatibilidade)
  const afiliacaoStr = apiPlant.autores?.[0]?.afiliacao || ''

  return {
    id: apiPlant.id_planta,
    nome: apiPlant.nome_comum || '',
    familia: apiPlant.familia,
    nomeCientifico: apiPlant.nome_cientifico,
    localColheita: locaisStr,
    numeroExcicata: apiPlant.numero_exsicata || '',
    parteUsada: partesUsadasStr,
    metodoPreparacao: metodosPreparacaoStr,
    usos: usosStr,
    metodoExtracao: metodosExtracaoStr,
    composicaoQuimica: compostosStr,
    propriedadesFarmacologicas: propriedadesStr,
    afiliacao: afiliacaoStr,
    referencia: apiPlant.referencia || '',
  }
}

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

  const performSearch = async () => {
    setIsLoading(true)
    setHasSearched(true)

    try {
      // Construir parâmetros de busca baseados nos filtros
      const searchParams = new URLSearchParams()
      
      // Combinar busca por nome popular e científico
      const searchTerm = [filters.popularName, filters.scientificName]
        .filter(Boolean)
        .join(' ')
      
      if (searchTerm) {
        searchParams.append('search', searchTerm)
      }
      
      // A API não tem filtros específicos para uso tradicional, autor e localização
      // então vamos buscar todos e filtrar no frontend
      searchParams.append('per_page', '100') // Buscar mais resultados para filtrar

      const response = await fetch(`${API_BASE_URL}/plantas?${searchParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Buscar detalhes completos de cada planta
        const plantsWithDetails = await Promise.all(
          data.plantas.map(async (plant: any) => {
            try {
              const detailResponse = await fetch(`${API_BASE_URL}/plantas/${plant.id_planta}`)
              if (detailResponse.ok) {
                const detailData: ApiPlant = await detailResponse.json()
                return convertApiPlantToFrontend(detailData)
              }
              return convertApiPlantToFrontend(plant)
            } catch (error) {
              console.error('Erro ao buscar detalhes da planta:', error)
              return convertApiPlantToFrontend(plant)
            }
          })
        )
        
        // Aplicar filtros adicionais no frontend
        const filteredResults = plantsWithDetails.filter((plant) => {
          const matchesTraditionalUse = !filters.traditionalUse || 
            plant.usos.toLowerCase().includes(filters.traditionalUse.toLowerCase())
          
          const matchesAuthor = !filters.author || 
            plant.afiliacao.toLowerCase().includes(filters.author.toLowerCase()) ||
            plant.referencia.toLowerCase().includes(filters.author.toLowerCase())
          
          const matchesLocation = !filters.observationLocation || 
            plant.localColheita.toLowerCase().includes(filters.observationLocation.toLowerCase())

          return matchesTraditionalUse && matchesAuthor && matchesLocation
        })

        setResults(filteredResults)
      } else {
        console.error('Erro na busca:', response.statusText)
        setResults([])
      }
    } catch (error) {
      console.error('Erro ao realizar busca:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
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