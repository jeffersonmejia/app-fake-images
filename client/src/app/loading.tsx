import styles from "./status.module.css";

export default function Loading() {
  return (
    <main className={styles.statusPage} aria-label="Cargando portada">
      <div className={styles.loadingGrid} role="status" aria-label="Cargando contenido">
        <div className={styles.loadingHero} />
        <div className={styles.loadingAside} />
        <div className={styles.loadingCards}>
          <div className={styles.loadingCard} />
          <div className={styles.loadingCard} />
          <div className={styles.loadingCard} />
        </div>
      </div>
    </main>
  );
}
