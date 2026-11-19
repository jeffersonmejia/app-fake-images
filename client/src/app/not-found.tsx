import Link from "next/link";
import styles from "./status.module.css";

export default function NotFound() {
  return (
    <main className={styles.statusPage}>
      <div className={styles.statusInner}>
        <span className={styles.statusKicker}>PULSO · 404</span>
        <h1 className={styles.statusTitle}>No encontramos esa página.</h1>
        <p className={styles.statusText}>Puede que el enlace haya cambiado o que la página ya no esté disponible.</p>
        <Link className={styles.statusLink} href="/">Volver a la portada</Link>
      </div>
    </main>
  );
}
