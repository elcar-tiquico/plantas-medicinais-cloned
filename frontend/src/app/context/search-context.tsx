"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

// Tipos para os filtros de busca
export interface SearchFilters {
  popularName: string
  scientificName: string
  family?: string
  traditionalUse?: string
  author?: string
  observationLocation?: string
}

// Tipo para os parâmetros da API
export interface ApiSearchParams {
  search?: string
  familia_id?: number
  autor_id?: number
  local_id?: number
  uso_id?: number
  page?: number
  per_page?: number
}

// Interface Plant completa (igual ao segundo arquivo) para manter compatibilidade
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

// Interface da API Flask para conversão interna
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

// Tipo para o contexto
interface SearchContextType {
  filters: SearchFilters
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>
  results: Plant[]
  isLoading: boolean
  hasSearched: boolean
  error: string | null
  performSearch: (customParams?: Partial<ApiSearchParams>) => Promise<void>
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// URL base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Filtros iniciais
const initialFilters: SearchFilters = {
  popularName: "",
  scientificName: "",
  family: "",
  traditionalUse: "",
  author: "",
  observationLocation: "",
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [results, setResults] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para converter dados da API para o formato esperado pelo frontend (igual ao segundo arquivo)
  const convertApiPlantToFrontend = (apiPlant: ApiPlant): Plant => {
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

// CORREÇÃO DA FUNÇÃO performSearch no search-context.tsx

// Função principal de busca
const performSearch = async (customParams?: Partial<ApiSearchParams>) => {
  console.log("Iniciando busca com filtros:", filters)
  console.log("Parâmetros customizados:", customParams)
  
  setIsLoading(true)
  setError(null)
  
  try {
    // Construir parâmetros da busca
    const searchParams: any = {
      page: 1,
      per_page: 50,
      ...customParams,
    }

    // Se não há parâmetros customizados, usar os filtros do formulário
    if (!customParams) {
      // CORREÇÃO PRINCIPAL: Enviar parâmetros específicos para cada campo
      if (filters.popularName && filters.popularName.trim()) {
        searchParams.search_popular = filters.popularName.trim()
      }
      
      if (filters.scientificName && filters.scientificName.trim()) {
        searchParams.search_cientifico = filters.scientificName.trim()
      }

      // Filtros por ID
      if (filters.family && filters.family !== "") {
        searchParams.familia_id = parseInt(filters.family)
      }
      
      if (filters.author && filters.author !== "") {
        searchParams.autor_id = parseInt(filters.author)
      }
      
      if (filters.observationLocation && filters.observationLocation !== "") {
        searchParams.local_id = parseInt(filters.observationLocation)
      }
      
      if (filters.traditionalUse && filters.traditionalUse !== "") {
        searchParams.uso_id = parseInt(filters.traditionalUse)
      }
    }

    console.log("Parâmetros finais da busca:", searchParams)

    // Construir URL com query parameters
    const url = new URL(`${API_BASE_URL}/plantas`)
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, value.toString())
      }
    })

    console.log("URL da requisição:", url.toString())

    // Fazer a requisição
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    console.log("Status da resposta:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na resposta:", errorText)
      throw new Error(`Erro na busca: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Dados recebidos:", data)

    // A API retorna um objeto com plantas, total, etc.
    let plantas: any[] = []
    
    if (Array.isArray(data)) {
      // Se a resposta é um array direto
      plantas = data
    } else if (data.plantas && Array.isArray(data.plantas)) {
      // Se a resposta tem a estrutura esperada com paginação
      plantas = data.plantas
    } else if (data.items && Array.isArray(data.items)) {
      // Estrutura alternativa
      plantas = data.items
    } else {
      console.warn("Estrutura de resposta não reconhecida:", data)
      plantas = []
    }

    // Buscar detalhes completos de cada planta
    const plantsWithDetails = await Promise.all(
      plantas.map(async (plant: any) => {
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
    
    console.log("Resultados transformados:", plantsWithDetails)
    
    setResults(plantsWithDetails)
    setHasSearched(true)
    
  } catch (error) {
    console.error("Erro na busca:", error)
    setError(error instanceof Error ? error.message : "Erro desconhecido na busca")
    setResults([])
    setHasSearched(true)
  } finally {
    setIsLoading(false)
  }
}

  // Função para limpar a busca
  const clearSearch = () => {
    console.log("Limpando busca")
    setFilters(initialFilters)
    setResults([])
    setHasSearched(false)
    setError(null)
  }

  const contextValue: SearchContextType = {
    filters,
    setFilters,
    results,
    isLoading,
    hasSearched,
    error,
    performSearch,
    clearSearch,
  }

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
}

// Hook para usar o contexto
export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch deve ser usado dentro de um SearchProvider")
  }
  return context
}