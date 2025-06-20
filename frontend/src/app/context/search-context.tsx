"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

// Tipos para os filtros de busca simplificados
export interface SearchFilters {
  popularName: string
  scientificName: string
  parteUsada?: string
  usoTradicional?: string
  provincia?: string
  author?: string
}

// Tipo para os parâmetros da API
export interface ApiSearchParams {
  search_popular?: string
  search_cientifico?: string
  parte_usada?: string
  indicacao_id?: number
  provincia_id?: number
  autor_id?: number
  page?: number
  per_page?: number
}

// Interface Plant simplificada
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
  // Novos campos detalhados
  nomes_comuns: string[]
  autores_detalhados: AutorDetalhado[]
  usos_especificos: UsoEspecifico[]
  provincias_detalhadas: ProvinciaDetalhada[]
  referencias_detalhadas: ReferenciaDetalhada[]
}

// Interfaces para dados detalhados
export interface AutorDetalhado {
  id_autor: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
}

export interface UsoEspecifico {
  id_uso_planta: number
  id_parte: number
  parte_usada: string
  observacoes?: string
  indicacoes: { id_indicacao: number; descricao: string }[]
  metodos_preparacao: { id_preparacao: number; descricao: string }[]
  metodos_extracao: { id_extraccao: number; descricao: string }[]
}

export interface ProvinciaDetalhada {
  id_provincia: number
  nome_provincia: string
}

export interface ReferenciaDetalhada {
  id_referencia: number
  link_referencia: string
  tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese'
  titulo_referencia?: string
  ano?: string
  autores?: Array<{
    id_autor: number
    nome_autor: string
    afiliacao?: string
    sigla_afiliacao?: string
    ordem_autor: number
    papel: 'primeiro' | 'correspondente' | 'coautor'
  }>
}

// Interface da API Flask
interface ApiPlant {
  id_planta: number
  nome_cientifico: string
  numero_exsicata?: string
  id_familia: number
  familia: string
  nomes_comuns: string[]
  autores?: Array<{ 
    id_autor: number
    nome_autor: string
    afiliacao?: string
    sigla_afiliacao?: string
  }>
  provincias?: Array<{ 
    id_provincia: number
    nome_provincia?: string
  }>
  partes_usadas?: Array<{ 
    id_uso: number
    parte_usada?: string
    observacoes?: string
    indicacoes?: Array<{ id_indicacao: number; descricao?: string }>
    metodos_preparacao?: Array<{ id_preparacao: number; descricao?: string }>
    metodos_extracao?: Array<{ id_extraccao: number; descricao?: string }>
  }>
  propriedades?: Array<{ id_propriedade: number; descricao?: string }>
  compostos?: Array<{ id_composto: number; nome_composto?: string }>
  referencias?: Array<{ 
    id_referencia: number
    link_referencia?: string
    tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese'
    titulo_referencia?: string
    ano?: string
    autores?: Array<{
      id_autor: number
      nome_autor: string
      afiliacao?: string
      sigla_afiliacao?: string
      ordem_autor: number
      papel: 'primeiro' | 'correspondente' | 'coautor'
    }>
  }>
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

// Filtros iniciais simplificados
const initialFilters: SearchFilters = {
  popularName: "",
  scientificName: "",
  parteUsada: "",
  usoTradicional: "",
  provincia: "",
  author: "",
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [results, setResults] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para converter dados da API para o formato esperado pelo frontend
  const convertApiPlantToFrontend = (apiPlant: ApiPlant): Plant => {
    console.log("Convertendo planta:", apiPlant.nome_cientifico, apiPlant)
    
    // Processar autores com detalhes completos
    const autores_detalhados: AutorDetalhado[] = apiPlant.autores?.map(a => ({
      id_autor: a.id_autor,
      nome_autor: a.nome_autor,
      afiliacao: a.afiliacao,
      sigla_afiliacao: a.sigla_afiliacao
    })) || []

    // Processar usos específicos
    const usos_especificos: UsoEspecifico[] = apiPlant.partes_usadas?.map(uso => {
      return {
        id_uso_planta: uso.id_uso,
        id_parte: uso.id_uso,
        parte_usada: uso.parte_usada || '',
        observacoes: uso.observacoes,
        indicacoes: uso.indicacoes?.map(ind => ({
          id_indicacao: ind.id_indicacao,
          descricao: ind.descricao || ''
        })) || [],
        metodos_preparacao: uso.metodos_preparacao?.map(mp => ({
          id_preparacao: mp.id_preparacao,
          descricao: mp.descricao || ''
        })) || [],
        metodos_extracao: uso.metodos_extracao?.map(me => ({
          id_extraccao: me.id_extraccao,
          descricao: me.descricao || ''
        })) || []
      }
    }) || []

    // Processar províncias
    const provincias_detalhadas: ProvinciaDetalhada[] = apiPlant.provincias?.map(p => ({
      id_provincia: p.id_provincia,
      nome_provincia: p.nome_provincia || ''
    })) || []

    // Processar referências com novos campos e autores
    const referencias_detalhadas: ReferenciaDetalhada[] = apiPlant.referencias?.map(r => ({
      id_referencia: r.id_referencia,
      link_referencia: r.link_referencia || '',
      tipo_referencia: r.tipo_referencia,
      titulo_referencia: r.titulo_referencia,
      ano: r.ano,
      autores: r.autores || []
    })) || []

    // Criar strings resumidas para compatibilidade com interface antiga
    const autoresStr = autores_detalhados.map(a => {
      let display = a.nome_autor
      if (a.afiliacao) {
        display += ` (${a.afiliacao})`
      }
      if (a.sigla_afiliacao) {
        display += ` [${a.sigla_afiliacao}]`
      }
      return display
    }).join(', ')
    
    const provinciasStr = provincias_detalhadas.map(p => p.nome_provincia).filter(Boolean).join('; ')
    
    const partesUsadasStr = usos_especificos.map(uso => uso.parte_usada).filter(Boolean).join(', ')
    
    const metodosPreparacaoStr = usos_especificos.flatMap(uso => 
      uso.metodos_preparacao.map(mp => mp.descricao)
    ).filter(Boolean).join('; ')
    
    const metodosExtracaoStr = usos_especificos.flatMap(uso => 
      uso.metodos_extracao.map(me => me.descricao)
    ).filter(Boolean).join('; ')
    
    // Agrupar usos por parte usada para mostrar correlação específica
    const usosStr = usos_especificos.map(uso => {
      const parteName = uso.parte_usada
      const indicacoes = uso.indicacoes.map(ind => ind.descricao).filter(Boolean)
      const observacoes = uso.observacoes ? ` (${uso.observacoes})` : ''
      
      if (indicacoes.length > 0) {
        return `${parteName}: ${indicacoes.join(', ')}${observacoes}`
      } else {
        return `${parteName}${observacoes}`
      }
    }).filter(Boolean).join(' | ')
    
    const propriedadesStr = apiPlant.propriedades?.map(p => p.descricao).filter(Boolean).join('; ') || ''
    const compostosStr = apiPlant.compostos?.map(c => c.nome_composto).filter(Boolean).join(', ') || ''
    
    const nomesComunsStr = apiPlant.nomes_comuns?.join(', ') || ''
    
    // Criar string de referências melhorada com autores
    const referenciasStr = referencias_detalhadas.map(r => {
      let referenceText = ''
      
      // Adicionar autores se existirem
      if (r.autores && r.autores.length > 0) {
        const autoresTexto = r.autores
          .sort((a, b) => a.ordem_autor - b.ordem_autor)
          .map(autor => {
            let nomeCompleto = autor.nome_autor
            if (autor.sigla_afiliacao) {
              nomeCompleto += ` (${autor.sigla_afiliacao})`
            }
            return nomeCompleto
          })
          .join('; ')
        
        referenceText = autoresTexto + '. '
      }
      
      // Adicionar título ou link
      if (r.titulo_referencia && r.titulo_referencia !== r.link_referencia) {
        referenceText += r.titulo_referencia
      } else {
        referenceText += r.link_referencia
      }
      
      // Adicionar ano
      if (r.ano) {
        referenceText += ` (${r.ano})`
      }
      
      // Adicionar tipo se não for URL
      if (r.tipo_referencia && r.tipo_referencia !== 'URL') {
        referenceText += ` [${r.tipo_referencia}]`
      }
      
      return referenceText
    }).filter(Boolean).join('; ')
    
    // Primeira afiliação para compatibilidade
    const afiliacaoStr = autores_detalhados[0]?.afiliacao || ''

    const result = {
      id: apiPlant.id_planta,
      nome: nomesComunsStr,
      familia: apiPlant.familia,
      nomeCientifico: apiPlant.nome_cientifico,
      localColheita: provinciasStr,
      numeroExcicata: apiPlant.numero_exsicata || '',
      parteUsada: partesUsadasStr,
      metodoPreparacao: metodosPreparacaoStr,
      usos: usosStr,
      metodoExtracao: metodosExtracaoStr,
      composicaoQuimica: compostosStr,
      propriedadesFarmacologicas: propriedadesStr,
      afiliacao: afiliacaoStr,
      referencia: referenciasStr,
      // Novos campos detalhados
      nomes_comuns: apiPlant.nomes_comuns || [],
      autores_detalhados,
      usos_especificos,
      provincias_detalhadas,
      referencias_detalhadas
    }

    console.log("Resultado final da conversão:", result)
    return result
  }

  // Função principal de busca
  const performSearch = async (customParams?: Partial<ApiSearchParams>) => {
    console.log("Iniciando busca com filtros:", filters)
    console.log("Parâmetros customizados:", customParams)
    
    setIsLoading(true)
    setError(null)
    
    try {
      const searchParams: any = {
        page: 1,
        per_page: 50,
        ...customParams,
      }

      if (!customParams) {
        // Busca por nome popular
        if (filters.popularName && filters.popularName.trim()) {
          searchParams.search_popular = filters.popularName.trim()
        }
        
        // Busca por nome científico
        if (filters.scientificName && filters.scientificName.trim()) {
          searchParams.search_cientifico = filters.scientificName.trim()
        }

        // Busca por parte usada (string)
        if (filters.parteUsada && filters.parteUsada.trim()) {
          searchParams.parte_usada = filters.parteUsada.trim()
        }
        
        // Busca por uso tradicional (ID da indicação)
        if (filters.usoTradicional && filters.usoTradicional !== "") {
          searchParams.indicacao_id = parseInt(filters.usoTradicional)
        }
        
        // Busca por província (ID)
        if (filters.provincia && filters.provincia !== "") {
          searchParams.provincia_id = parseInt(filters.provincia)
        }
        
        // Busca por autor (ID)
        if (filters.author && filters.author !== "") {
          searchParams.autor_id = parseInt(filters.author)
        }
      }

      console.log("Parâmetros finais da busca:", searchParams)

      const url = new URL(`${API_BASE_URL}/plantas`)
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value.toString())
        }
      })

      console.log("URL da requisição:", url.toString())

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

      let plantas: any[] = []
      
      if (Array.isArray(data)) {
        plantas = data
      } else if (data.plantas && Array.isArray(data.plantas)) {
        plantas = data.plantas
      } else if (data.items && Array.isArray(data.items)) {
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