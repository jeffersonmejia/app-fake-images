import Image from "next/image";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import styles from "./page.module.css";

const sections = ["Actualidad", "Ecuador", "Mundo", "Economía", "Cultura", "Ideas"];

const articleSpaces = [
  {
    category: "CIUDAD",
    image: "/images/city-walk.svg",
    alt: "Ilustración de una calle arbolada y peatonal",
  },
  {
    category: "ECONOMÍA",
    image: "/images/economy.svg",
    alt: "Ilustración de edificios modernos bajo un cielo celeste",
  },
  {
    category: "CULTURA",
    image: "/images/culture.svg",
    alt: "Ilustración de una galería de arte contemporáneo",
  },
];

export default function Home() {
  return (
    <main className={styles.site}>
      <h1 className={styles.screenReaderOnly}>Pulso, portada de noticias</h1>

      <div className={styles.editionBar}>
        <div className={`${styles.container} ${styles.editionInner}`}>
          <span>EDICIÓN DE MUESTRA</span>
          <span className={styles.editionDivider} aria-hidden="true" />
          <span>QUITO · ECUADOR</span>
          <span className={styles.editionNote}>Periodismo para mirar más de cerca</span>
        </div>
      </div>

      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.masthead}>
            <a className={styles.brand} href="#inicio" aria-label="Pulso, inicio">
              <span className={styles.brandMark} aria-hidden="true">p.</span>
              <span className={styles.brandWord}>pulso</span>
            </a>
            <p className={styles.tagline}>Periodismo para mirar más de cerca.</p>
            <div className={styles.headerActions}>
              <a className={styles.searchButton} href="#historias" aria-label="Ir a las historias">
                <Search size={19} strokeWidth={1.7} aria-hidden="true" />
              </a>
              <a className={styles.subscribeLink} href="#historias">Explorar</a>
              <details className={styles.mobileMenu}>
                <summary aria-label="Abrir menú de secciones">
                  <span className={styles.menuOpenIcon}><Menu size={20} strokeWidth={1.7} aria-hidden="true" /></span>
                  <span className={styles.menuCloseIcon}><X size={20} strokeWidth={1.7} aria-hidden="true" /></span>
                </summary>
                <nav className={styles.mobileNavPanel} aria-label="Secciones móviles">
                  {sections.map((section) => <a key={section} href="#historias">{section}</a>)}
                  <a href="#historias">Opinión</a>
                </nav>
              </details>
            </div>
          </div>

          <nav className={styles.navigation} aria-label="Secciones">
            {sections.map((section, index) => (
              <a key={section} href={index === 0 ? "#inicio" : "#historias"}>{section}</a>
            ))}
            <a className={styles.opinionLink} href="#historias">Opinión</a>
          </nav>
        </div>
      </header>

      <div className={styles.container} id="inicio">
        <section className={styles.leadSection} aria-label="Noticia principal">
          <div className={styles.sectionEyebrow}>
            <span>PORTADA</span>
            <span className={styles.eyebrowLine} aria-hidden="true" />
            <span className={styles.eyebrowDate}>CONTENIDO PENDIENTE</span>
          </div>

          <div className={styles.leadGrid}>
            <article className={styles.leadStory}>
              <div className={styles.leadImageLink}>
                <Image
                  className={styles.leadImage}
                  src="/images/cover-city.svg"
                  alt="Ilustración de una ciudad entre montañas al amanecer"
                  fill
                  priority
                  sizes="(max-width: 760px) 100vw, 66vw"
                />
              </div>
              <div className={styles.leadCopy}>
                <span className={styles.category}>NOTICIA PRINCIPAL</span>
                <div id="cover-title" role="status" className={styles.titlePlaceholder} aria-label="Titular principal pendiente de recibir">
                  <span />
                  <span />
                </div>
                <div className={styles.summaryPlaceholder} aria-hidden="true"><span /></div>
              </div>
            </article>

            <aside className={styles.trending} aria-labelledby="sections-title">
              <div className={styles.asideHeading}>
                <h2 id="sections-title">Secciones</h2>
                <span className={styles.asideDot} aria-hidden="true" />
              </div>
              <p className={styles.asideIntro}>Elige un tema para explorar.</p>
              <ul className={styles.sectionList}>
                {sections.slice(1, 4).map((section, index) => (
                  <li key={section}>
                    <span className={styles.trendingNumber}>0{index + 1}</span>
                    <a href="#historias">{section}<ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" /></a>
                  </li>
                ))}
              </ul>
              <a className={styles.allStories} href="#historias">Ver todas las secciones <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" /></a>
            </aside>
          </div>
        </section>

        <section className={styles.latestSection} id="historias" aria-labelledby="latest-title">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionKicker}>CONTENIDO EDITORIAL</span>
              <h2 id="latest-title">Últimas noticias</h2>
            </div>
            <a href="#inicio" className={styles.viewAll}>Volver arriba <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" /></a>
          </div>

          <div className={styles.articleGrid}>
            {articleSpaces.map((article) => (
              <article className={styles.articleCard} key={article.category}>
                <div className={styles.cardImage}>
                  <Image src={article.image} alt={article.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.category}>{article.category}</span>
                  <div role="status" className={styles.cardTitlePlaceholder} aria-label="Titular pendiente de recibir" />
                  <div className={styles.cardMetaPlaceholder} aria-hidden="true"><span /><span /></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <a className={styles.footerBrand} href="#inicio">pulso<span>.</span></a>
          <p>Periodismo para mirar más de cerca.</p>
          <span className={styles.footerNote}>Vista previa · Titulares pendientes de entrega</span>
        </div>
      </footer>
    </main>
  );
}
