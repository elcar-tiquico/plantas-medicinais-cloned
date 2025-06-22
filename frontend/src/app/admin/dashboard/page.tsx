"use client";
import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';

// Interfaces TypeScript (mantidas iguais)
interface StatItem {
  value: number;
  change: string;
  change_type: 'increase' | 'decrease' | 'stable';
}

interface DashboardStats {
  total_plantas: StatItem;
  total_familias: StatItem;
  idiomas_disponiveis: StatItem;
  pesquisas_realizadas: StatItem;
}

interface FamiliaData {
  name: string;
  count: number;
  percentage: number;
}

interface ProvinciaData {
  name: string;
  count: number;
  percentage: number;
}

interface PlantaRecente {
  id: number;
  name: string;
  scientific_name: string;
  family: string;
  exsicata: string;
  added_at: string;
}

interface IdiomaData {
  language: string;
  count: number;
  percentage: number;
}

interface ReferenciaStats {
  total_referencias: number;
  referencias_com_plantas: number;
  referencias_sem_ano: number;
  tipos: Array<{ tipo: string; count: number }>;
  por_ano: Array<{ ano: string; count: number }>;
  mais_utilizadas: Array<{
    id: number;
    titulo: string;
    tipo: string;
    ano: string;
    total_plantas: number;
  }>;
}

interface AutorStats {
  total_autores: number;
  autores_com_plantas: number;
  autores_sem_afiliacao: number;
  total_afiliacoes: number;
  mais_produtivos: Array<{
    id: number;
    nome: string;
    afiliacao: string;
    sigla: string;
    total_plantas: number;
  }>;
  por_afiliacao: Array<{
    afiliacao: string;
    total_autores: number;
    total_plantas: number;
  }>;
}

interface ReferenciaRecente {
  id: number;
  titulo: string;
  tipo: string;
  ano: string;
  link: string;
  total_plantas: number;
  autores: string[];
}

interface AutorRecente {
  id: number;
  nome: string;
  afiliacao: string;
  sigla: string;
  total_plantas: number;
  total_referencias: number;
}

// Componente principal
const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para dados REAIS da API
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [plantasPorFamilia, setPlantasPorFamilia] = useState<FamiliaData[]>([]);
  const [plantasPorProvincia, setPlantasPorProvincia] = useState<ProvinciaData[]>([]);
  const [plantasRecentes, setPlantasRecentes] = useState<PlantaRecente[]>([]);
  const [plantasPorIdioma, setPlantasPorIdioma] = useState<IdiomaData[]>([]);
  const [referenciaStats, setReferenciaStats] = useState<ReferenciaStats | null>(null);
  const [autorStats, setAutorStats] = useState<AutorStats | null>(null);
  const [referenciasRecentes, setReferenciasRecentes] = useState<ReferenciaRecente[]>([]);
  const [autoresRecentes, setAutoresRecentes] = useState<AutorRecente[]>([]);

  const API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5001/api/admin/dashboard';

  // Função para fazer fetch dos dados REAIS da API
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Carregando dados REAIS da API:', API_BASE_URL);

      // Fazer todas as chamadas da API REAL em paralelo
      const [
        statsResponse,
        familiasResponse,
        provinciasResponse,
        recentesResponse,
        idiomasResponse,
        referenciaStatsResponse,
        autorStatsResponse,
        referenciasRecentesResponse,
        autoresRecentesResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`),
        fetch(`${API_BASE_URL}/plantas-por-familia?limit=6`),
        fetch(`${API_BASE_URL}/plantas-por-provincia`),
        fetch(`${API_BASE_URL}/plantas-recentes?limit=5`),
        fetch(`${API_BASE_URL}/plantas-por-idioma`),
        fetch(`${API_BASE_URL}/referencias-stats`),
        fetch(`${API_BASE_URL}/autores-stats`),
        fetch(`${API_BASE_URL}/referencias-recentes?limit=5`),
        fetch(`${API_BASE_URL}/autores-recentes?limit=5`)
      ]);

      // Verificar se todas as respostas foram bem-sucedidas
      const responses = [
        statsResponse, familiasResponse, provinciasResponse, recentesResponse,
        idiomasResponse, referenciaStatsResponse, autorStatsResponse,
        referenciasRecentesResponse, autoresRecentesResponse
      ];

      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          throw new Error(`Erro na API: ${responses[i].status} - ${responses[i].statusText}`);
        }
      }

      // Parse das respostas JSON
      const [
        statsData,
        familiasData,
        provinciasData,
        recentesData,
        idiomasData,
        referenciaStatsData,
        autorStatsData,
        referenciasRecentesData,
        autoresRecentesData
      ] = await Promise.all([
        statsResponse.json(),
        familiasResponse.json(),
        provinciasResponse.json(),
        recentesResponse.json(),
        idiomasResponse.json(),
        referenciaStatsResponse.json(),
        autorStatsResponse.json(),
        referenciasRecentesResponse.json(),
        autoresRecentesResponse.json()
      ]);

      // Atualizar todos os estados com dados REAIS
      setStats(statsData);
      setPlantasPorFamilia(familiasData.familias || []);
      setPlantasPorProvincia(provinciasData.provincias || []);
      setPlantasRecentes(recentesData.plantas_recentes || []);
      setPlantasPorIdioma(idiomasData.idiomas || []);
      setReferenciaStats(referenciaStatsData);
      setAutorStats(autorStatsData);
      setReferenciasRecentes(referenciasRecentesData.referencias_recentes || []);
      setAutoresRecentes(autoresRecentesData.autores_recentes || []);

      console.log('✅ Dados REAIS carregados com sucesso:', {
        stats: statsData,
        familias: familiasData.familias?.length || 0,
        provincias: provinciasData.provincias?.length || 0,
        plantasRecentes: recentesData.plantas_recentes?.length || 0,
        idiomas: idiomasData.idiomas?.length || 0,
        referencias: referenciaStatsData.total_referencias || 0,
        autores: autorStatsData.total_autores || 0
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados da API:', error);
      setError(`Erro ao conectar com a API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // NÃO usar fallback - mostrar erro para que possamos corrigir a API
      setStats(null);
      setPlantasPorFamilia([]);
      setPlantasPorProvincia([]);
      setPlantasRecentes([]);
      setPlantasPorIdioma([]);
      setReferenciaStats(null);
      setAutorStats(null);
      setReferenciasRecentes([]);
      setAutoresRecentes([]);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Componente de Loading
  const LoadingSpinner: React.FC = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <span className={styles.loadingText}>Carregando dados reais...</span>
    </div>
  );

  // ===== ÍCONES MELHORADOS =====
  
  // Novo ícone para plantas (mais orgânico - folha/planta)
  const LeafIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );

  // Alternativo: Ícone de planta mais realista
  const PlantIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.5 3 6v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-6c1.5-1.5 3-3.5 3-6 0-3.5-2.5-6-6-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 8c0-2.2 1.8-4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8c0-2.2-1.8-4-4-4" />
    </svg>
  );

  // Novo ícone para famílias (árvore genealógica/taxonomia)
  const TreeIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8a4 4 0 108 0v10a2 2 0 11-4 0V8zM12 8V6a2 2 0 114 0v2m0 0v10a2 2 0 11-4 0V8m0 0a4 4 0 108 0" />
    </svg>
  );

  // Alternativo: Ícone de classificação/taxonomia
  const ClassificationIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  // Manter outros ícones iguais
  const LanguageIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
    </svg>
  );

  const SearchIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const DownloadIcon: React.FC = () => (
    <svg className={styles.iconSmall} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );

  const PlusIcon: React.FC = () => (
    <svg className={styles.iconSmall} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
    </svg>
  );

  const MapIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  // Função para criar gráfico de pizza
  const createPieChart = (data: FamiliaData[]) => {
    if (!data || data.length === 0) return null;
    
    const size = 200;
    const center = size / 2;
    const radius = 80;
    
    let currentAngle = 0;
    const colors = ['#9333ea', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'];
    
    return (
      <svg width={size} height={size} className={styles.pieChart}>
        {data.map((item, index) => {
          const percentage = item.percentage;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          // Converter ângulos para radianos
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          // Calcular pontos do arco
          const x1 = center + radius * Math.cos(startAngleRad);
          const y1 = center + radius * Math.sin(startAngleRad);
          const x2 = center + radius * Math.cos(endAngleRad);
          const y2 = center + radius * Math.sin(endAngleRad);
          
          // Flag para arco grande
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          // Criar path do segmento
          const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <g key={index}>
              <path
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                className={styles.pieSegment}
              />
              <title>{`${item.name}: ${item.count} plantas (${item.percentage}%)`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  // Componente de legenda para o gráfico
  const PieChartLegend: React.FC<{ data: FamiliaData[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const colors = ['#9333ea', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'];
    
    return (
      <div className={styles.chartLegend}>
        {data.map((item, index) => (
          <div key={index} className={styles.legendItem}>
            <div 
              className={styles.legendColor}
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className={styles.legendText}>
              {item.name} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <div className={styles.buttonGroup}>
            <button className={styles.buttonPurple}>
              <DownloadIcon />
              <span>Exportar Relatório</span>
            </button>
            <button className={styles.buttonGreen}>
              <PlusIcon />
              <span>Adicionar Planta</span>
            </button>
            {error && (
              <button className={styles.buttonBlue} onClick={fetchData}>
                <span>🔄 Tentar Novamente</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>
              ⚠️ {error}
              <br />
              <small>Verifique se a API está rodando em {API_BASE_URL}</small>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {loading ? (
          <LoadingSpinner />
        ) : stats ? (
          <div className={styles.statsGrid}>
            {/* ===== ÍCONE MELHORADO PARA PLANTAS ===== */}
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.iconContainerGreen}>
                  <LeafIcon />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Total de Plantas</p>
                  <p className={styles.statValue}>{stats.total_plantas?.value || 0}</p>
                </div>
              </div>
              <div className={styles.statFooter}>
                <div className={styles.statChange}>
                  <span className={styles.statIncrease}>{stats.total_plantas?.change || '+0%'}</span>
                  <span className={styles.statPeriod}> desde o mês passado</span>
                </div>
              </div>
            </div>

            {/* ===== ÍCONE MELHORADO PARA FAMÍLIAS ===== */}
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.iconContainerPurple}>
                  <TreeIcon />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Famílias Botânicas</p>
                  <p className={styles.statValue}>{stats.total_familias?.value || 0}</p>
                </div>
              </div>
              <div className={styles.statFooter}>
                <div className={styles.statChange}>
                  <span className={styles.statIncrease}>{stats.total_familias?.change || '+0%'}</span>
                  <span className={styles.statPeriod}> desde o mês passado</span>
                </div>
              </div>
            </div>

            {/* Manter outros cards iguais */}
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.iconContainerBlue}>
                  <LanguageIcon />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Idiomas Disponíveis</p>
                  <p className={styles.statValue}>{stats.idiomas_disponiveis?.value || 0}</p>
                </div>
              </div>
              <div className={styles.statFooter}>
                <div className={styles.statChange}>
                  <span className={styles.statIncrease}>{stats.idiomas_disponiveis?.change || '+0%'}</span>
                  <span className={styles.statPeriod}> desde o mês passado</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.iconContainerYellow}>
                  <SearchIcon />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Pesquisas Realizadas</p>
                  <p className={styles.statValue}>{stats.pesquisas_realizadas?.value || 0}</p>
                </div>
              </div>
              <div className={styles.statFooter}>
                <div className={styles.statChange}>
                  <span className={styles.statIncrease}>{stats.pesquisas_realizadas?.change || '+0%'}</span>
                  <span className={styles.statPeriod}> desde o mês passado</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.loadingContainer}>
            <span className={styles.loadingText}>Dados não disponíveis</span>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsHeader}>
            <nav className={styles.tabsNav}>
              {[
                { id: 'overview', label: 'Visão Geral' },
                { id: 'categories', label: 'Famílias' },
                { id: 'languages', label: 'Idiomas' },
                { id: 'locations', label: 'Locais de Colheita' },
                { id: 'references', label: 'Referências' },
                { id: 'authors', label: 'Autores' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className={styles.tabContent}>
            {/* Visão Geral */}
            {activeTab === 'overview' && (
              <div>
                <h3 className={styles.tabTitle}>Visão Geral do Sistema</h3>
                <p className={styles.tabDescription}>
                  Bem-vindo ao painel administrativo do PhytoMoz. Aqui você pode gerir todas as plantas, famílias botânicas,
                  idiomas e locais de colheita, referências e autores no sistema.
                </p>

                {/* Plantas Recentes */}
                {loading ? (
                  <LoadingSpinner />
                ) : plantasRecentes.length > 0 ? (
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Plantas Recentemente Adicionadas</h4>
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead className={styles.tableHead}>
                          <tr>
                            <th className={styles.tableHeader}>Nome</th>
                            <th className={styles.tableHeader}>Nome Científico</th>
                            <th className={styles.tableHeader}>Família</th>
                            <th className={styles.tableHeader}>Data de Adição</th>
                            <th className={styles.tableHeader}>
                              <span className={styles.srOnly}>Editar</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                          {plantasRecentes.map((planta) => (
                            <tr key={planta.id} className={styles.tableRow}>
                              <td className={styles.tableCell}>{planta.name}</td>
                              <td className={styles.tableCell}>
                                <em>{planta.scientific_name}</em>
                              </td>
                              <td className={styles.tableCell}>{planta.family}</td>
                              <td className={styles.tableCell}>{planta.added_at}</td>
                              <td className={styles.tableCellAction}>
                                <a href="#" className={styles.editLink}>Editar</a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhuma planta recente disponível</span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Acções Rápidas</h4>
                  <div className={styles.quickActionsGrid}>
                    <div className={styles.quickActionCardPurple}>
                      <div className={styles.quickActionContent}>
                        <div className={styles.quickActionIconPurple}>
                          <LeafIcon />
                        </div>
                        <div className={styles.quickActionInfo}>
                          <p className={styles.quickActionTitle}>Adicionar Nova Planta</p>
                          <p className={styles.quickActionDescription}>Cadastre uma nova planta na base de dados</p>
                        </div>
                      </div>
                      <div className={styles.quickActionFooter}>
                        <a href="#" className={styles.quickActionLinkPurple}>
                          Iniciar →
                        </a>
                      </div>
                    </div>

                    <div className={styles.quickActionCardGreen}>
                      <div className={styles.quickActionContent}>
                        <div className={styles.quickActionIconGreen}>
                          <LanguageIcon />
                        </div>
                        <div className={styles.quickActionInfo}>
                          <p className={styles.quickActionTitle}>Gestão de Traduções</p>
                          <p className={styles.quickActionDescription}>Adicione ou edite traduções para os idiomas disponíveis</p>
                        </div>
                      </div>
                      <div className={styles.quickActionFooter}>
                        <a href="#" className={styles.quickActionLinkGreen}>
                          Iniciar →
                        </a>
                      </div>
                    </div>

                    <div className={styles.quickActionCardBlue}>
                      <div className={styles.quickActionContent}>
                        <div className={styles.quickActionIconBlue}>
                          <MapIcon />
                        </div>
                        <div className={styles.quickActionInfo}>
                          <p className={styles.quickActionTitle}>Mapear Locais</p>
                          <p className={styles.quickActionDescription}>Adicione ou edite locais de colheita</p>
                        </div>
                      </div>
                      <div className={styles.quickActionFooter}>
                        <a href="#" className={styles.quickActionLinkBlue}>
                          Iniciar →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ABA FAMÍLIAS MELHORADA COM TABELA ===== */}
            {activeTab === 'categories' && (
              <div>
                <h3 className={styles.tabTitle}>Plantas por Família</h3>
                <p className={styles.tabDescription}>
                  Visualize a distribuição de plantas por família botânica na base de dados.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : plantasPorFamilia.length > 0 ? (
                  <>
                    <div className={styles.chartsGrid}>
                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Distribuição por Família</h4>
                        <div className={styles.pieChartContainer}>
                          <div className={styles.pieChartWrapper}>
                            {createPieChart(plantasPorFamilia)}
                          </div>
                          <PieChartLegend data={plantasPorFamilia} />
                        </div>
                      </div>

                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Análise de Diversidade</h4>
                        <div className={styles.progressList}>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Família Mais Rica</span>
                              <span className={styles.progressValue}>
                                {plantasPorFamilia[0]?.name || 'N/A'}
                              </span>
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFillGreen} 
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <span className={styles.progressPercentage}>
                              {plantasPorFamilia[0]?.count || 0} plantas ({plantasPorFamilia[0]?.percentage || 0}%)
                            </span>
                          </div>

                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Top 3 Concentração</span>
                              <span className={styles.progressValue}>
                                {plantasPorFamilia.slice(0, 3).reduce((sum, f) => sum + f.percentage, 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFillBlue} 
                                style={{ 
                                  width: `${plantasPorFamilia.slice(0, 3).reduce((sum, f) => sum + f.percentage, 0)}%` 
                                }}
                              ></div>
                            </div>
                            <span className={styles.progressPercentage}>Das plantas totais</span>
                          </div>

                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Total de Famílias</span>
                              <span className={styles.progressValue}>{plantasPorFamilia.length} famílias</span>
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFillPurple} 
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <span className={styles.progressPercentage}>Com plantas cadastradas</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ===== NOVA TABELA DE FAMÍLIAS (substituindo o ranking) ===== */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>Famílias Cadastradas</h4>
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead className={styles.tableHead}>
                            <tr>
                              <th className={styles.tableHeader}>Posição</th>
                              <th className={styles.tableHeader}>Nome da Família</th>
                              <th className={styles.tableHeader}>Total de Plantas</th>
                              <th className={styles.tableHeader}>Percentual</th>
                              <th className={styles.tableHeader}>Diversidade</th>
                              <th className={styles.tableHeader}>
                                <span className={styles.srOnly}>Gerir</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className={styles.tableBody}>
                            {plantasPorFamilia.map((familia, index) => (
                              <tr key={index} className={styles.tableRow}>
                                <td className={styles.tableCell}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: '600', color: '#9333ea' }}>#{index + 1}</span>
                                    {index === 0 && <span>👑</span>}
                                    {index === 1 && <span>🥈</span>}
                                    {index === 2 && <span>🥉</span>}
                                  </div>
                                </td>
                                <td className={styles.tableCell}>
                                  <div className={styles.tableCellTitle}>
                                    {familia.name}
                                  </div>
                                </td>
                                <td className={styles.tableCell}>
                                  <span style={{ fontWeight: '600', color: '#111827' }}>
                                    {familia.count}
                                  </span>
                                  <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.25rem' }}>
                                    plantas
                                  </span>
                                </td>
                                <td className={styles.tableCell}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: '500', color: '#9333ea' }}>
                                      {familia.percentage}%
                                    </span>
                                    <div style={{ 
                                      width: '40px', 
                                      height: '4px', 
                                      backgroundColor: '#e5e7eb', 
                                      borderRadius: '2px',
                                      overflow: 'hidden'
                                    }}>
                                      <div 
                                        style={{ 
                                          width: `${familia.percentage}%`, 
                                          height: '100%', 
                                          backgroundColor: '#9333ea',
                                          transition: 'width 0.3s ease'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className={styles.tableCell}>
                                  <span className={styles.badge}>
                                    {familia.percentage > 15 ? 'ALTA' : 
                                     familia.percentage > 5 ? 'MÉDIA' : 'BAIXA'}
                                  </span>
                                </td>
                                <td className={styles.tableCellAction}>
                                  <a href="#" className={styles.editLink}>Gerir</a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de família disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <a href="/admin/categories" className={styles.buttonPurple}>
                    Gerir famílias
                  </a>
                </div>
              </div>
            )}

            {/* Idiomas */}
            {activeTab === 'languages' && (
              <div>
                <h3 className={styles.tabTitle}>Plantas por Idioma</h3>
                <p className={styles.tabDescription}>
                  Visualize a distribuição de plantas por idioma disponível na base de dados.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : plantasPorIdioma.length > 0 ? (
                  <div className={styles.chartCard}>
                    <h4 className={styles.chartTitle}>Cobertura por Idioma</h4>
                    <div className={styles.progressList}>
                      {plantasPorIdioma.map((idioma, index) => (
                        <div key={index} className={styles.progressItem}>
                          <div className={styles.progressInfo}>
                            <span className={styles.progressLabel}>{idioma.language}</span>
                            <span className={styles.progressValue}>{idioma.count} plantas</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFillGreen} 
                              style={{ width: `${idioma.percentage}%` }}
                            ></div>
                          </div>
                          <span className={styles.progressPercentage}>{idioma.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de idioma disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <a href="/admin/languages" className={styles.buttonGreen}>
                    Gerir idiomas
                  </a>
                </div>
              </div>
            )}

            {/* Locais de Colheita */}
            {activeTab === 'locations' && (
              <div>
                <h3 className={styles.tabTitle}>Plantas por Local de Colheita</h3>
                <p className={styles.tabDescription}>
                  Visualize a distribuição de plantas por local de colheita em Moçambique.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : plantasPorProvincia.length > 0 ? (
                  <div className={styles.chartCard}>
                    <h4 className={styles.chartTitle}>Distribuição por Província</h4>
                    <div className={styles.progressListScroll}>
                      {plantasPorProvincia.map((provincia, index) => (
                        <div key={index} className={styles.progressItem}>
                          <div className={styles.progressInfo}>
                            <span className={styles.progressLabel}>{provincia.name}</span>
                            <span className={styles.progressValue}>{provincia.count} associações</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFillBlue} 
                              style={{ width: `${provincia.percentage}%` }}
                            ></div>
                          </div>
                          <span className={styles.progressPercentage}>{provincia.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de província disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <a href="/admin/locations" className={styles.buttonBlue}>
                    Gerir locais
                  </a>
                </div>
              </div>
            )}

            {/* Referências */}
            {activeTab === 'references' && (
              <div>
                <h3 className={styles.tabTitle}>Gestão de Referências</h3>
                <p className={styles.tabDescription}>
                  Visualize e faça a gestão das referências bibliográficas do sistema.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : referenciaStats ? (
                  <>
                    <div className={styles.chartsGrid}>
                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Distribuição por Tipo</h4>
                        <div className={styles.progressList}>
                          {referenciaStats.tipos.map((tipo, index) => (
                            <div key={index} className={styles.progressItem}>
                              <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>{tipo.tipo}</span>
                                <span className={styles.progressValue}>{tipo.count} referências</span>
                              </div>
                              <div className={styles.progressBar}>
                                <div 
                                  className={styles.progressFillPurple} 
                                  style={{ width: `${(tipo.count / referenciaStats.total_referencias) * 100}%` }}
                                ></div>
                              </div>
                              <span className={styles.progressPercentage}>
                                {((tipo.count / referenciaStats.total_referencias) * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Estatísticas Gerais</h4>
                        <div className={styles.progressList}>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Total de Referências</span>
                              <span className={styles.progressValue}>{referenciaStats.total_referencias}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Com Plantas Associadas</span>
                              <span className={styles.progressValue}>{referenciaStats.referencias_com_plantas}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Sem Ano Definido</span>
                              <span className={styles.progressValue}>{referenciaStats.referencias_sem_ano}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Referências Recentes */}
                    {referenciasRecentes.length > 0 && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Referências Recentemente Adicionadas</h4>
                        <div className={styles.tableContainer}>
                          <table className={styles.table}>
                            <thead className={styles.tableHead}>
                              <tr>
                                <th className={styles.tableHeader}>Título</th>
                                <th className={styles.tableHeader}>Tipo</th>
                                <th className={styles.tableHeader}>Ano</th>
                                <th className={styles.tableHeader}>Plantas</th>
                                <th className={styles.tableHeader}>Autores</th>
                                <th className={styles.tableHeader}>
                                  <span className={styles.srOnly}>Editar</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                              {referenciasRecentes.map((ref) => (
                                <tr key={ref.id} className={styles.tableRow}>
                                  <td className={styles.tableCell}>
                                    <div className={styles.tableCellTitle}>
                                      {ref.titulo.length > 50 ? `${ref.titulo.substring(0, 50)}...` : ref.titulo}
                                    </div>
                                  </td>
                                  <td className={styles.tableCell}>
                                    <span className={styles.badge}>{ref.tipo}</span>
                                  </td>
                                  <td className={styles.tableCell}>{ref.ano || 'N/A'}</td>
                                  <td className={styles.tableCell}>{ref.total_plantas}</td>
                                  <td className={styles.tableCell}>
                                    <div className={styles.authorList}>
                                      {ref.autores.length > 0 ? ref.autores.slice(0, 2).join(', ') : 'Sem autores'}
                                      {ref.autores.length > 2 && ` +${ref.autores.length - 2}`}
                                    </div>
                                  </td>
                                  <td className={styles.tableCellAction}>
                                    <a href="#" className={styles.editLink}>Editar</a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Referências Mais Utilizadas */}
                    {referenciaStats.mais_utilizadas.length > 0 && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Referências Mais Utilizadas</h4>
                        <div className={styles.progressList}>
                          {referenciaStats.mais_utilizadas.slice(0, 5).map((ref, index) => (
                            <div key={index} className={styles.progressItem}>
                              <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>
                                  {ref.titulo.length > 40 ? `${ref.titulo.substring(0, 40)}...` : ref.titulo}
                                  {ref.ano && ` (${ref.ano})`}
                                </span>
                                <span className={styles.progressValue}>{ref.total_plantas} plantas</span>
                              </div>
                              <div className={styles.progressBar}>
                                <div 
                                  className={styles.progressFillPurple} 
                                  style={{ 
                                    width: `${(ref.total_plantas / Math.max(...referenciaStats.mais_utilizadas.map(r => r.total_plantas))) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de referência disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <a href="/admin/references" className={styles.buttonPurple}>
                    Gerir referências
                  </a>
                </div>
              </div>
            )}

            {/* Autores */}
            {activeTab === 'authors' && (
              <div>
                <h3 className={styles.tabTitle}>Gestão de Autores</h3>
                <p className={styles.tabDescription}>
                  Visualize e faça a gestão dos autores.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : autorStats ? (
                  <>
                    <div className={styles.chartsGrid}>
                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Autores Mais Produtivos</h4>
                        <div className={styles.progressList}>
                          {autorStats.mais_produtivos.slice(0, 5).map((autor, index) => (
                            <div key={index} className={styles.progressItem}>
                              <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>
                                  {autor.nome}
                                  {autor.sigla && ` (${autor.sigla})`}
                                </span>
                                <span className={styles.progressValue}>{autor.total_plantas} plantas</span>
                              </div>
                              <div className={styles.progressBar}>
                                <div 
                                  className={styles.progressFillGreen} 
                                  style={{ 
                                    width: `${(autor.total_plantas / Math.max(...autorStats.mais_produtivos.map(a => a.total_plantas))) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Estatísticas Gerais</h4>
                        <div className={styles.progressList}>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Total de Autores</span>
                              <span className={styles.progressValue}>{autorStats.total_autores}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Com Plantas Associadas</span>
                              <span className={styles.progressValue}>{autorStats.autores_com_plantas}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Sem Afiliação</span>
                              <span className={styles.progressValue}>{autorStats.autores_sem_afiliacao}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Total de Afiliações</span>
                              <span className={styles.progressValue}>{autorStats.total_afiliacoes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Autores Recentes */}
                    {autoresRecentes.length > 0 && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Autores Recentemente Adicionados</h4>
                        <div className={styles.tableContainer}>
                          <table className={styles.table}>
                            <thead className={styles.tableHead}>
                              <tr>
                                <th className={styles.tableHeader}>Nome</th>
                                <th className={styles.tableHeader}>Afiliação</th>
                                <th className={styles.tableHeader}>Sigla</th>
                                <th className={styles.tableHeader}>Plantas</th>
                                <th className={styles.tableHeader}>Referências</th>
                                <th className={styles.tableHeader}>
                                  <span className={styles.srOnly}>Editar</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                              {autoresRecentes.map((autor) => (
                                <tr key={autor.id} className={styles.tableRow}>
                                  <td className={styles.tableCell}>
                                    <div className={styles.tableCellTitle}>{autor.nome}</div>
                                  </td>
                                  <td className={styles.tableCell}>
                                    <div className={styles.affiliationText}>
                                      {autor.afiliacao.length > 30 ? `${autor.afiliacao.substring(0, 30)}...` : autor.afiliacao}
                                    </div>
                                  </td>
                                  <td className={styles.tableCell}>
                                    {autor.sigla && <span className={styles.badge}>{autor.sigla}</span>}
                                  </td>
                                  <td className={styles.tableCell}>{autor.total_plantas}</td>
                                  <td className={styles.tableCell}>{autor.total_referencias}</td>
                                  <td className={styles.tableCellAction}>
                                    <a href="#" className={styles.editLink}>Editar</a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Distribuição por Afiliação */}
                    {autorStats.por_afiliacao.length > 0 && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Distribuição por Afiliação</h4>
                        <div className={styles.progressListScroll}>
                          {autorStats.por_afiliacao.slice(0, 8).map((afiliacao, index) => (
                            <div key={index} className={styles.progressItem}>
                              <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>
                                  {afiliacao.afiliacao.length > 35 ? `${afiliacao.afiliacao.substring(0, 35)}...` : afiliacao.afiliacao}
                                </span>
                                <span className={styles.progressValue}>
                                  {afiliacao.total_autores} autores, {afiliacao.total_plantas} plantas
                                </span>
                              </div>
                              <div className={styles.progressBar}>
                                <div 
                                  className={styles.progressFillBlue} 
                                  style={{ 
                                    width: `${(afiliacao.total_plantas / Math.max(...autorStats.por_afiliacao.map(a => a.total_plantas))) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de autor disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <a href="/admin/authors" className={styles.buttonGreen}>
                    Gerir autores
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;