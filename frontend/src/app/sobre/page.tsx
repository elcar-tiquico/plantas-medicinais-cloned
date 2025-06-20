import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import styles from "./sobre.module.css"

export default function Sobre() {
  return (
    <main>
      <Header />
      <div className="container">
        <div className={styles.sobreContainer}>
          <div className={styles.sobreHeader}>
            <h1 className={styles.sobreTitle}>Sobre o Projeto PhytoMoz</h1>
            <p className={styles.sobreSubtitle}>
              Base de dados bibliográfica das plantas medicinais de Moçambique
            </p>
          </div>

          <div className={styles.sobreContent}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Objetivo do Projeto</h2>
              <p className={styles.sectionText}>
                O PhytoMoz é uma base de dados abrangente que visa documentar, preservar e disponibilizar 
                informações sobre as plantas medicinais utilizadas em Moçambique. Este projeto contribui 
                para a preservação do conhecimento tradicional e fornece uma ferramenta valiosa para 
                pesquisadores, profissionais de saúde e comunidades locais.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Características da Base de Dados</h2>
              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🌿</div>
                  <h3 className={styles.featureTitle}>Plantas Medicinais</h3>
                  <p className={styles.featureText}>
                    Informações detalhadas sobre espécies medicinais nativas e utilizadas em Moçambique
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>📚</div>
                  <h3 className={styles.featureTitle}>Referências Científicas</h3>
                  <p className={styles.featureText}>
                    Compilação de estudos, artigos e publicações sobre propriedades farmacológicas
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🗺️</div>
                  <h3 className={styles.featureTitle}>Distribuição Geográfica</h3>
                  <p className={styles.featureText}>
                    Mapeamento da ocorrência das plantas por províncias e regiões de Moçambique
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>⚗️</div>
                  <h3 className={styles.featureTitle}>Composição Química</h3>
                  <p className={styles.featureText}>
                    Dados sobre compostos ativos e propriedades farmacológicas das plantas
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>👥</div>
                  <h3 className={styles.featureTitle}>Conhecimento Tradicional</h3>
                  <p className={styles.featureText}>
                    Documentação dos usos tradicionais e métodos de preparação
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🔍</div>
                  <h3 className={styles.featureTitle}>Busca Avançada</h3>
                  <p className={styles.featureText}>
                    Sistema de pesquisa por múltiplos critérios para facilitar o acesso às informações
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Metodologia</h2>
              <p className={styles.sectionText}>
                A construção desta base de dados baseou-se numa revisão sistemática da literatura científica, 
                incluindo artigos publicados em revistas indexadas, teses, dissertações e relatórios técnicos. 
                As informações foram validadas e organizadas de forma estruturada para garantir a qualidade 
                e confiabilidade dos dados apresentados.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Importância do Projeto</h2>
              <div className={styles.importanceList}>
                <div className={styles.importanceItem}>
                  <h4 className={styles.importanceTitle}>Preservação Cultural</h4>
                  <p className={styles.importanceText}>
                    Documentação e preservação do conhecimento tradicional sobre plantas medicinais
                  </p>
                </div>
                <div className={styles.importanceItem}>
                  <h4 className={styles.importanceTitle}>Apoio à Investigação</h4>
                  <p className={styles.importanceText}>
                    Ferramenta de apoio para investigadores em farmacologia, botânica e medicina tradicional
                  </p>
                </div>
                <div className={styles.importanceItem}>
                  <h4 className={styles.importanceTitle}>Desenvolvimento Sustentável</h4>
                  <p className={styles.importanceText}>
                    Contribuição para o desenvolvimento de medicamentos naturais e sustentabilidade ambiental
                  </p>
                </div>
                <div className={styles.importanceItem}>
                  <h4 className={styles.importanceTitle}>Acesso Público</h4>
                  <p className={styles.importanceText}>
                    Disponibilização gratuita de informações para comunidades, estudantes e profissionais
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Equipa do Projeto</h2>
              <div className={styles.teamGrid}>
                <div className={styles.teamMember}>
                  <h4 className={styles.memberName}>Elcar Macuácua</h4>
                  <p className={styles.memberRole}>Desenvolvedor Principal</p>
                  <p className={styles.memberDescription}>
                    Responsável pelo desenvolvimento da plataforma e implementação da base de dados
                  </p>
                </div>
                <div className={styles.teamMember}>
                  <h4 className={styles.memberName}>Curso de Farmácia - ISCTEM</h4>
                  <p className={styles.memberRole}>Instituição Parceira</p>
                  <p className={styles.memberDescription}>
                    Apoio académico e validação científica das informações compiladas
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Como Utilizar</h2>
              <div className={styles.usageSteps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Aceda à Pesquisa</h4>
                    <p className={styles.stepText}>
                      Utilize o formulário de pesquisa na página inicial para encontrar plantas específicas
                    </p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Defina Critérios</h4>
                    <p className={styles.stepText}>
                      Filtre por nome popular, científico, província, uso tradicional ou autor
                    </p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Explore os Resultados</h4>
                    <p className={styles.stepText}>
                      Analise as informações detalhadas sobre cada planta e suas propriedades
                    </p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Consulte Referências</h4>
                    <p className={styles.stepText}>
                      Aceda às fontes científicas para aprofundar o seu conhecimento
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Contacto e Colaboração</h2>
              <p className={styles.sectionText}>
                Este projeto está em constante desenvolvimento e agradecemos contribuições da comunidade científica. 
                Para sugestões, correções ou colaborações, entre em contacto através dos canais disponíveis.
              </p>
              <div className={styles.contactInfo}>
                <p className={styles.contactText}>
                  <strong>Desenvolvedor:</strong> Elcar Macuácua<br />
                  <strong>Instituição:</strong> Curso de Farmácia - ISCTEM<br />
                  <strong>Ano:</strong> {new Date().getFullYear()}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}