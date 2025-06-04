"use client"
import type { Plant } from "@/context/search-context"
import { useLanguage } from "@/context/language-context"
import { useState } from "react"
import styles from "./plant-details.module.css"

interface PlantDetailsProps {
  plant: Plant
}

export function PlantDetails({ plant }: PlantDetailsProps) {
  const { translate } = useLanguage()
  const [showArticle, setShowArticle] = useState(false)

  // Artigo simulado para demonstração
  const sampleArticle = `
    <h2>Estudo sobre ${plant.nome} (${plant.nomeCientifico})</h2>
    
    <p><strong>Resumo:</strong> Este estudo investiga as propriedades medicinais de ${
      plant.nomeCientifico
    }, conhecida popularmente como ${plant.nome}, uma planta nativa encontrada em ${
      plant.localColheita
    }. Foram analisados os compostos ativos presentes em ${
      plant.parteUsada
    } e sua eficácia no tratamento de diversas condições de saúde.</p>
    
    <h3>Introdução</h3>
    <p>${plant.nome} tem sido utilizada tradicionalmente por comunidades locais para o tratamento de ${
      plant.usos
    }. Este estudo visa validar cientificamente esses usos tradicionais através de análises fitoquímicas e ensaios farmacológicos.</p>
    
    <h3>Metodologia</h3>
    <p>Amostras de ${plant.parteUsada} foram coletadas em ${plant.localColheita} e processadas utilizando ${
      plant.metodoExtracao
    }. Os extratos foram analisados por cromatografia e espectrometria de massa para identificação dos compostos bioativos.</p>
    
    <h3>Resultados</h3>
    <p>As análises revelaram a presença de ${plant.composicaoQuimica}, compostos conhecidos por suas propriedades ${
      plant.propriedadesFarmacologicas
    }. Os ensaios in vitro e in vivo confirmaram a eficácia da planta no tratamento das condições mencionadas nos usos tradicionais.</p>
    
    <h3>Discussão</h3>
    <p>Os resultados obtidos corroboram com o conhecimento tradicional sobre o uso de ${
      plant.nome
    }. A presença de compostos bioativos específicos explica os mecanismos de ação observados nos tratamentos tradicionais.</p>
    
    <h3>Conclusão</h3>
    <p>Este estudo valida cientificamente o uso tradicional de ${
      plant.nome
    } e abre caminho para o desenvolvimento de novos medicamentos baseados em seus compostos bioativos.</p>
    
    <p><strong>Palavras-chave:</strong> ${plant.nome}, ${plant.nomeCientifico}, fitoquímica, etnofarmacologia</p>
    
    <p><strong>Referência:</strong> ${plant.referencia}</p>
    <p><strong>Afiliação:</strong> ${plant.afiliacao}</p>
  `

  return (
    <div className={styles.plantDetails}>
      <div className={styles.detailsGrid}>
        <div className={styles.plantImageSection}>
          <div className={styles.plantImageCard}>
            <div className={styles.plantImagePlaceholder}>
              <span className={styles.placeholderText}>Imagem da planta</span>
            </div>
            <div className={styles.plantImageInfo}>
              <h4 className={styles.plantName}>{plant.nome}</h4>
              <p className={styles.plantFamily}>{plant.familia}</p>

              <div className={styles.plantActions}>
                <button
                  className={styles.downloadButton}
                  onClick={() => alert(`Baixando artigo sobre ${plant.nome}...`)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.buttonIcon}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {translate("details.downloadArticle")}
                </button>
                <button className={styles.readButton} onClick={() => setShowArticle(!showArticle)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.buttonIcon}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  {showArticle ? "Ocultar artigo" : translate("details.readArticle")}
                </button>
                <button
                  className={styles.moreButton}
                  onClick={() => alert(`Abrindo página detalhada sobre ${plant.nome}...`)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.buttonIcon}
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                  {translate("details.moreDetails")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.plantInfoSection}>
          {showArticle ? (
            <div className={styles.articleCard}>
              <div className={styles.articleHeader}>
                <h3 className={styles.articleTitle}>Artigo Científico</h3>
              </div>
              <div className={styles.articleBody} dangerouslySetInnerHTML={{ __html: sampleArticle }}></div>
            </div>
          ) : (
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <h3 className={styles.infoTitle}>{translate("details.info")}</h3>
              </div>

              <div className={styles.infoList}>
                <DetailRow label={translate("search.scientificName")} value={plant.nomeCientifico} />
                <DetailRow label={translate("plant.family")} value={plant.familia} />
                <DetailRow label={translate("plant.commonName")} value={plant.nome} />
                <DetailRow label={translate("plant.location")} value={plant.localColheita} />
                <DetailRow label={translate("plant.specimenNumber")} value={plant.numeroExcicata} />
                <DetailRow label={translate("plant.partUsed")} value={plant.parteUsada} />
                <DetailRow label={translate("plant.preparation")} value={plant.metodoPreparacao} />
                <DetailRow label={translate("plant.uses")} value={plant.usos} />
                <DetailRow label={translate("plant.extraction")} value={plant.metodoExtracao} />
                <DetailRow label={translate("plant.composition")} value={plant.composicaoQuimica} />
                <DetailRow label={translate("plant.properties")} value={plant.propriedadesFarmacologicas} />
                <DetailRow label={translate("plant.affiliation")} value={plant.afiliacao} />
                <DetailRow label={translate("plant.reference")} value={plant.referencia} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  )
}
