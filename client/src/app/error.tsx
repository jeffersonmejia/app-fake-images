"use client";

import styles from "./status.module.css";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className={styles.statusPage}>
      <div className={styles.statusInner}>
        <span className={styles.statusKicker}>PULSO · ERROR</span>
        <h1 className={styles.statusTitle}>No pudimos cargar esta página.</h1>
        <p className={styles.statusText}>Inténtalo de nuevo. Si el problema continúa, vuelve a la portada.</p>
        <button className={styles.statusButton} type="button" onClick={reset}>Intentar de nuevo</button>
      </div>
    </main>
  );
}
