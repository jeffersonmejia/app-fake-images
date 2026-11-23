"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Building2, Eye, FileText, Heart, Image as ImageIcon, LoaderCircle, MapPin, Newspaper, Palette, Plus, TrendingUp, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import styles from "@/app/page.module.css";

const visuals = [
  { image: "/images/cover-city.svg", alt: "Ilustración editorial de una ciudad al amanecer", category: "ACTUALIDAD" },
  { image: "/images/city-walk.svg", alt: "Ilustración editorial de una calle arbolada", category: "CIUDAD" },
  { image: "/images/economy.svg", alt: "Ilustración editorial de edificios de una ciudad", category: "ECONOMÍA" },
  { image: "/images/culture.svg", alt: "Ilustración editorial de una galería", category: "CULTURA" },
];
const topics = ["Todos", ...visuals.map(({ category }) => category)];
const topicIcons = { Todos: Newspaper, ACTUALIDAD: Newspaper, CIUDAD: Building2, ECONOMÍA: TrendingUp, CULTURA: Palette };
const imageVerificationSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "INCONCLUSIVE", "UNAVAILABLE", "NOT_CONFIGURED"]),
  imageSha256: z.string(),
  classification: z.enum(["PROBABLE_REAL", "PROBABLE_AI"]).optional(),
  score: z.number().min(0).max(1).optional(),
  provider: z.string().optional(),
  modelVersion: z.string().optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  reasonCode: z.string().optional(),
});
type ImageVerification = z.infer<typeof imageVerificationSchema>;

type Story = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  image: string;
  isDemo: boolean;
  isLocalDraft: boolean;
  imageVerification?: ImageVerification;
};

function demoStory(index: number): Story {
  const visual = visuals[index % visuals.length];
  return {
    id: `demo-${index}`,
    title: `Muestra editorial ${String(index + 1).padStart(2, "0")} — Santo Domingo`,
    summary: "Contenido ficticio de demostración. No corresponde a un hecho real.",
    body: "Datos de prueba para revisar el diseño del feed.",
    category: visual.category,
    image: visual.image,
    isDemo: true,
    isLocalDraft: false,
  };
}

function NewsPost({ story }: { story: Story }) {
  const [liked, setLiked] = useState(false);

  return (
    <article className={styles.post}>
      <div className={styles.postHeader}>
        <span className={styles.avatarPlaceholder} aria-hidden="true" />
        <div className={styles.byline}>
          <span className={styles.bylineName}>{story.isDemo ? "Redacción · prueba" : story.isLocalDraft ? "Borrador local" : "Redacción"}</span>
          <span className={styles.bylineMeta}><MapPin size={12} aria-hidden="true" />{story.isDemo ? "Santo Domingo / contenido de prueba" : story.isLocalDraft ? "Solo en esta sesión · no publicado" : "Santo Domingo"}</span>
        </div>
        <span className={styles.category}>{story.category.toLocaleLowerCase("es")}</span>
      </div>

      <div className={styles.postImage}>
        <Image src={story.image} alt={`${story.title} (imagen ilustrativa)`} fill sizes="(max-width: 720px) 100vw, 680px" unoptimized={story.image.startsWith("blob:")} />
      </div>

      <div className={styles.postContent}>
        {story.isDemo && <span className={styles.demoBadge}>Contenido de prueba — no es noticia real</span>}
        {story.isLocalDraft && <span className={styles.demoBadge}>Borrador local — no publicado</span>}
        <h2 className={styles.storyTitle}>{story.title}</h2>
        {story.imageVerification?.classification && <p className={styles.modelResult}>
          El clasificador estima que la imagen es {story.imageVerification.classification === "PROBABLE_AI" ? "probablemente generada por IA" : "probablemente real"} (puntaje {story.imageVerification.score?.toFixed(3)}). Esto no verifica la noticia.
        </p>}
        <p className={styles.storySummary}>{story.summary}</p>
        {story.body && <p className={styles.storyBody}>{story.body}</p>}
      </div>

      <div className={styles.postActions}>
        <button
          className={liked ? styles.liked : undefined}
          type="button"
          aria-pressed={liked}
          onClick={() => setLiked((value) => !value)}
        >
          <Heart size={18} strokeWidth={1.8} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
          {liked ? "Te gusta" : "Me gusta"}
        </button>
      </div>
    </article>
  );
}

function CreateStoryModal({ onClose, onCreate }: { onClose: () => void; onCreate: (story: Story) => void }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ACTUALIDAD");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(visuals[0].image);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageVerification, setImageVerification] = useState<ImageVerification | null>(null);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const keepImagePreviewRef = useRef(false);
  const imageRequestRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    if (image.startsWith("blob:") && !keepImagePreviewRef.current) URL.revokeObjectURL(image);
  }, [image]);

  useEffect(() => () => {
    const request = imageRequestRef.current;
    imageRequestRef.current = null;
    request?.abort();
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();
    const manageDialogKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", manageDialogKeyboard);
    return () => {
      window.removeEventListener("keydown", manageDialogKeyboard);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const selectImageFile = async (file: File | null) => {
    if (!file) return;
    imageRequestRef.current?.abort();
    const controller = new AbortController();
    imageRequestRef.current = controller;
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setImageVerification(null);
    setVerificationMessage("");
    setIsVerifyingImage(true);

    try {
      const formData = new FormData();
      formData.set("image", file);
      const response = await fetch("/api/images/verify", { method: "POST", body: formData, signal: controller.signal });
      if (!response.ok) {
        setVerificationMessage("No se pudo analizar la imagen. Revisa el formato y el tamaño e inténtalo de nuevo.");
        return;
      }
      const parsed = imageVerificationSchema.safeParse(await response.json());
      if (!parsed.success) {
        setVerificationMessage("El servicio devolvió una respuesta inválida; no hay resultado.");
        return;
      }
      setImageVerification(parsed.data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setVerificationMessage("El servicio de análisis no está disponible; no hay resultado.");
      }
    } finally {
      if (imageRequestRef.current === controller) {
        imageRequestRef.current = null;
        setIsVerifyingImage(false);
      }
    }
  };

  const selectIllustration = (value: string) => {
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImageFile(null);
    setImage(value);
    setImageVerification(null);
    setVerificationMessage("");
  };

  const submit = () => {
    if (image.startsWith("blob:")) keepImagePreviewRef.current = true;
    onCreate({ id: `draft-${crypto.randomUUID()}`, title, summary: summary.trim(), body: body.trim(), category, image, isDemo: false, isLocalDraft: true, imageVerification: imageVerification ?? undefined });
  };

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="create-title" tabIndex={-1}>
        <div className={styles.modalHeader}>
          <div><p className={styles.asideLabel}>Nueva publicación / paso {step} de 3</p><h2 id="create-title">Crear noticia</h2></div>
          <button className={styles.closeButton} type="button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button>
        </div>
        <div className={styles.stepTrack} aria-label={`Paso ${step} de 3`}>
          {[FileText, ImageIcon, Eye].map((StepIcon, index) => <span key={index} className={step >= index + 1 ? styles.stepActive : ""}><StepIcon size={15} aria-hidden="true" /></span>)}
        </div>

        {step === 1 && <div className={styles.formStep}>
          <label htmlFor="story-title">Titular</label>
          <input id="story-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="Escribe el titular de la noticia" />
          <label htmlFor="story-category">Tema</label>
          <select id="story-category" value={category} onChange={(event) => setCategory(event.target.value)}>{visuals.map((item) => <option key={item.category}>{item.category}</option>)}</select>
          <p className={styles.formHint}>El titular se muestra tal como lo escribas.</p>
        </div>}

        {step === 2 && <div className={styles.formStep}>
          <label htmlFor="story-summary">Resumen</label>
          <textarea id="story-summary" value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={280} rows={3} placeholder="Un resumen breve" />
          <label htmlFor="story-body">Contenido</label>
          <textarea id="story-body" value={body} onChange={(event) => setBody(event.target.value)} rows={5} placeholder="Escribe el contenido" />
          <label htmlFor="story-image"><ImageIcon size={15} aria-hidden="true" />Imagen ilustrativa para la vista previa</label>
          <select id="story-image" value={imageFile ? "uploaded" : image} onChange={(event) => selectIllustration(event.target.value)}>
            {imageFile && <option value="uploaded">Imagen cargada: {imageFile.name}</option>}
            {visuals.map((item) => <option key={item.image} value={item.image}>{item.category}</option>)}
          </select>
          <label htmlFor="image-upload">Imagen para analizar (JPEG, PNG o WebP; hasta 10 MB)</label>
          <input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ""; void selectImageFile(file); }} />
          {isVerifyingImage && <p className={styles.formHint} role="status"><LoaderCircle size={14} aria-hidden="true" />Analizando con el modelo local…</p>}
          {imageVerification?.classification && <p className={styles.modelResult} role="status">El clasificador estima que la imagen es {imageVerification.classification === "PROBABLE_AI" ? "probablemente generada por IA" : "probablemente real"} (puntaje {imageVerification.score?.toFixed(3)}). No verifica la veracidad de la noticia.</p>}
          {imageVerification && !imageVerification.classification && <p className={styles.formHint} role="status">{imageVerification.status === "NOT_CONFIGURED" ? "El servicio de análisis no está configurado." : imageVerification.status === "UNAVAILABLE" ? "El servicio de análisis no está disponible; no hay resultado." : "El modelo no pudo emitir un resultado concluyente."}</p>}
          {verificationMessage && <p className={styles.formHint} role="status">{verificationMessage}</p>}
          <p className={styles.formHint}>La noticia queda como borrador local y solo vive en esta sesión.</p>
        </div>}

        {step === 3 && <div className={styles.previewStep}>
          <span className={styles.demoBadge}>VISTA PREVIA</span>
          <h3>{title}</h3>
          <p className={styles.previewCategory}><MapPin size={13} aria-hidden="true" />{category.toLocaleLowerCase("es")} — Santo Domingo</p>
          <p>{summary}</p>
          <p className={styles.previewBody}>{body}</p>
          <Image src={image} alt="Vista previa de imagen ilustrativa" width={560} height={300} />
        </div>}

        <div className={styles.modalActions}>
          {step > 1 ? <button className={styles.secondaryButton} type="button" onClick={() => setStep((value) => value - 1)}><ArrowLeft size={16} aria-hidden="true" />Atrás</button> : <button className={styles.secondaryButton} type="button" onClick={onClose}>Cancelar</button>}
          {step < 3 ? <button className={styles.primaryButton} type="button" disabled={isVerifyingImage || (step === 1 ? !title.trim() : !summary.trim() || !body.trim())} onClick={() => setStep((value) => value + 1)}>Continuar<ArrowRight size={16} aria-hidden="true" /></button> : <button className={styles.primaryButton} type="button" disabled={isVerifyingImage} onClick={submit}>Agregar al feed<ArrowRight size={16} aria-hidden="true" /></button>}
        </div>
      </section>
    </div>
  );
}

export function NewsFeed() {
  const [posts, setPosts] = useState(() => Array.from({ length: 6 }, (_, index) => demoStory(index)));
  const [selectedTopic, setSelectedTopic] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const feedRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setPosts((current) => [...current, ...Array.from({ length: 3 }, (_, index) => demoStory(current.length + index))]);
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }, 250);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const feed = feedRef.current;
    if (!sentinel || !feed) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMore(); }, { root: feed, rootMargin: "420px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    if (isModalOpen) return;

    const handleFeedNavigation = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("button, input, select, textarea, a, [contenteditable='true']")) return;

      const direction = event.key === "ArrowDown" || event.key === "PageDown" || (event.key === " " && !event.shiftKey)
        ? 1
        : event.key === "ArrowUp" || event.key === "PageUp" || (event.key === " " && event.shiftKey)
          ? -1
          : 0;
      const feed = feedRef.current;
      if (!feed || direction === 0) return;

      event.preventDefault();
      feed.scrollBy({
        top: direction * feed.clientHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    };

    window.addEventListener("keydown", handleFeedNavigation);
    return () => window.removeEventListener("keydown", handleFeedNavigation);
  }, [isModalOpen]);

  const visiblePosts = posts.filter((post) => selectedTopic === "Todos" || post.category === selectedTopic);
  const selectTopic = (topic: string) => {
    setSelectedTopic(topic);
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  const addStory = (story: Story) => {
    setPosts((current) => [story, ...current]);
    setSelectedTopic("Todos");
    setIsModalOpen(false);
    feedRef.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.screenReaderOnly}>Feed de noticias</h1>
      <div className={styles.layout}>
        <aside className={styles.leftAside} aria-label="Temas del feed">
          <a className={styles.brand} href="#inicio" aria-label="Pulso, inicio"><span aria-hidden="true">p.</span>pulso</a>
          <p className={styles.asideLabel}>EXPLORAR</p>
          <nav className={styles.topicList} aria-label="Filtrar noticias por tema">
            {topics.map((topic) => { const TopicIcon = topicIcons[topic as keyof typeof topicIcons]; return <button key={topic} type="button" className={selectedTopic === topic ? styles.activeTopic : undefined} aria-pressed={selectedTopic === topic} onClick={() => selectTopic(topic)}><TopicIcon size={17} strokeWidth={1.8} aria-hidden="true" />{topic === "Todos" ? "todo el feed" : topic.toLocaleLowerCase("es")}</button>; })}
          </nav>
          <button className={styles.sideCreateButton} type="button" onClick={() => setIsModalOpen(true)}><Plus size={16} aria-hidden="true" />Crear noticia</button>
        </aside>

        <section ref={feedRef} className={styles.feed} id="inicio" aria-label="Noticias. Usa las flechas arriba o abajo, Av Pág o Espacio para cambiar de publicación." tabIndex={0}>
          {visiblePosts.map((story) => <NewsPost key={story.id} story={story} />)}
          <div ref={sentinelRef} className={styles.feedEnd} aria-live="polite">{isLoadingMore ? <><LoaderCircle size={18} aria-hidden="true" /><span>Cargando publicaciones de prueba</span></> : <span>Desplázate para ver más publicaciones de prueba</span>}</div>
        </section>

        <aside className={styles.rightAside} aria-label="Información del feed">
          <section className={styles.infoCard}><p className={styles.asideLabel}>FEED ABIERTO</p><p className={styles.infoText}>Noticias periodísticas en una sola página, para recorrer a tu ritmo.</p><div className={styles.infoRule} /><p className={styles.infoSmall}>Usa ↓, ↑, Av Pág o Espacio para pasar de publicación.</p></section>
          <section className={styles.infoCard}><p className={styles.asideLabel}>Zona de muestra</p><p className={styles.infoText}><MapPin size={16} aria-hidden="true" />Santo Domingo</p><p className={styles.infoSmall}>Los titulares marcados como prueba son ficticios y sirven para revisar el diseño.</p><div className={styles.sideIllustration}><Image src="/images/city-walk.svg" alt="Ilustración de una calle de ciudad" fill sizes="240px" /></div></section>
          <p className={styles.footerNote}><Eye size={14} aria-hidden="true" />Lectura abierta <span>Sin cuenta</span></p>
        </aside>
      </div>
      {isModalOpen && <CreateStoryModal onClose={() => setIsModalOpen(false)} onCreate={addStory} />}
    </main>
  );
}
