"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays, Eye, FileText, Heart, Image as ImageIcon, Landmark, LoaderCircle, MapPin, Newspaper, Plus, TrendingUp, UserRound, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { z } from "zod";
import styles from "@/app/page.module.css";

const visuals = [
  { image: "/images/cover-city.svg", alt: "Ilustración editorial de una ciudad al amanecer", category: "Social" },
  { image: "/images/city-walk.svg", alt: "Ilustración editorial de una calle arbolada", category: "Crónica" },
  { image: "/images/economy.svg", alt: "Ilustración editorial de edificios de una ciudad", category: "Económico" },
  { image: "/images/culture.svg", alt: "Ilustración editorial de una galería", category: "Político" },
];
const topics = ["Todo", "Local", "Social", "Económico", "Político", "Crónica"];
const topicIcons: Record<string, typeof Newspaper> = {
  Todo: Newspaper,
  Local: MapPin,
  Social: Users,
  Económico: TrendingUp,
  Político: Landmark,
  Crónica: BookOpenText,
};

const ecuadorCities = [
  { city: "Quito", province: "Pichincha", latitude: -0.1807, longitude: -78.4678 },
  { city: "Guayaquil", province: "Guayas", latitude: -2.1709, longitude: -79.9224 },
  { city: "Cuenca", province: "Azuay", latitude: -2.9001, longitude: -79.0059 },
  { city: "Santo Domingo", province: "Santo Domingo de los Tsáchilas", latitude: -0.2522, longitude: -79.1754 },
  { city: "Machala", province: "El Oro", latitude: -3.2581, longitude: -79.9554 },
  { city: "Portoviejo", province: "Manabí", latitude: -1.0546, longitude: -80.4545 },
  { city: "Loja", province: "Loja", latitude: -3.9931, longitude: -79.2042 },
  { city: "Ambato", province: "Tungurahua", latitude: -1.2491, longitude: -78.6168 },
  { city: "Esmeraldas", province: "Esmeraldas", latitude: 0.9592, longitude: -79.6539 },
  { city: "Ibarra", province: "Imbabura", latitude: 0.3517, longitude: -78.1223 },
  { city: "Riobamba", province: "Chimborazo", latitude: -1.6636, longitude: -78.6546 },
  { city: "Latacunga", province: "Cotopaxi", latitude: -0.9346, longitude: -78.6156 },
  { city: "Babahoyo", province: "Los Ríos", latitude: -1.8022, longitude: -79.5344 },
  { city: "Azogues", province: "Cañar", latitude: -2.7397, longitude: -78.8486 },
  { city: "Tulcán", province: "Carchi", latitude: 0.8119, longitude: -77.7173 },
  { city: "Guaranda", province: "Bolívar", latitude: -1.5926, longitude: -79.0009 },
  { city: "Tena", province: "Napo", latitude: -0.9938, longitude: -77.8129 },
  { city: "Puyo", province: "Pastaza", latitude: -1.4924, longitude: -78.0036 },
  { city: "Macas", province: "Morona Santiago", latitude: -2.3087, longitude: -78.1111 },
  { city: "Zamora", province: "Zamora Chinchipe", latitude: -4.0692, longitude: -78.9567 },
  { city: "Nueva Loja", province: "Sucumbíos", latitude: 0.0847, longitude: -76.8828 },
  { city: "Puerto Francisco de Orellana", province: "Orellana", latitude: -0.4665, longitude: -76.9872 },
  { city: "Santa Elena", province: "Santa Elena", latitude: -2.2267, longitude: -80.8587 },
  { city: "Puerto Baquerizo Moreno", province: "Galápagos", latitude: -0.9017, longitude: -89.6102 },
];
const ecuadorProvinces = [...new Set(ecuadorCities.map(({ province }) => province))];
type LocationSelection = { kind: "country" | "province" | "city"; province?: string; city?: string };
const locationLabel = (location: LocationSelection) => location.kind === "city" ? `${location.city}, ${location.province}` : location.kind === "province" ? location.province ?? "Ecuador" : "Ecuador";
const spanishMonths: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
function parseStoryDate(value: string) {
  const match = /^(\d{1,2})\s+([a-z]{3})\s+(\d{4})$/i.exec(value.trim());
  if (match) {
    const month = spanishMonths[match[2].toLocaleLowerCase("es")];
    if (month !== undefined) return new Date(Number(match[3]), month, Number(match[1]), 12);
  }
  const fallbackDate = new Date(value);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}
function formatRelativeDate(value: string, now = Date.now()) {
  const date = parseStoryDate(value);
  if (!date) return value;
  const seconds = (now - date.getTime()) / 1000;
  const absoluteSeconds = Math.abs(seconds);
  const [unit, divisor] = absoluteSeconds < 45
    ? ["second", 1] as const
    : absoluteSeconds < 90 * 60 ? (absoluteSeconds < 45 * 60 ? ["minute", 60] as const : ["hour", 3600] as const)
      : absoluteSeconds < 36 * 3600 ? ["hour", 3600] as const
        : absoluteSeconds < 45 * 86400 ? ["day", 86400] as const
          : absoluteSeconds < 345 * 86400 ? ["month", 30 * 86400] as const : ["year", 365 * 86400] as const;
  const amount = Math.max(1, Math.round(absoluteSeconds / divisor));
  return new Intl.RelativeTimeFormat("es", { numeric: "always" }).format(seconds >= 0 ? -amount : amount, unit);
}
function RelativeTimestamp({ value, live = false }: { value: string; live?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timestamp = parseStoryDate(value)?.getTime();
    if (!timestamp) return;
    let timer = 0;
    const update = () => {
      const current = Date.now();
      setNow(current);
      if (live) timer = window.setTimeout(update, current - timestamp < 60_000 ? 1000 : 60_000);
    };
    timer = window.setTimeout(update, 0);
    return () => window.clearTimeout(timer);
  }, [live, value]);
  return <time dateTime={parseStoryDate(value)?.toISOString() ?? value}>{now === null ? value : formatRelativeDate(value, now)}</time>;
}
const imageVerificationSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "INCONCLUSIVE", "UNAVAILABLE", "NOT_CONFIGURED"]),
  imageSha256: z.string(),
  imageUrl: z.string().regex(/^\/uploaded-images\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i),
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
  images?: string[];
  isDemo: boolean;
  isLocalDraft: boolean;
  sourceName?: string;
  sourceDate?: string;
  createdAt?: string;
  sourceUrl?: string;
  national?: boolean;
  province?: string;
  provinces?: string[];
  city?: string;
  imageVerification?: ImageVerification;
};

const demoStories: Omit<Story, "id">[] = [
  {
    title: "El Inamhi prevé lluvias fuertes en provincias de la Costa y la Sierra",
    summary: "El pronóstico advertía precipitaciones fuertes en varias provincias durante la noche del 21 y la madrugada del 22 de noviembre.",
    body: "La previsión incluía sectores de Guayas, Manabí, Santa Elena, Los Ríos y Santo Domingo, además de cantones de la Sierra. La información corresponde al boletín citado por Primicias.",
    category: "Social",
    provinces: ["Guayas", "Manabí", "Santa Elena", "Los Ríos", "Santo Domingo de los Tsáchilas", "Esmeraldas", "Pichincha", "Cotopaxi", "Tungurahua", "Chimborazo"],
    image: "https://imagenes.primicias.ec/files/image_480_270/uploads/2026/11/21/6b01ecb108b33.jpeg",
    images: [
      "https://imagenes.primicias.ec/files/image_480_270/uploads/2026/11/21/6b01ecb108b33.jpeg",
      "https://imagenes.primicias.ec/files/image_original/uploads/2026/11/21/6b01eed6aa413.webp",
      "https://imagenes.primicias.ec/files/image_original/uploads/2026/11/21/6b01eeff5ee4f.webp",
    ],
    isDemo: true,
    isLocalDraft: false,
    sourceName: "Primicias",
    sourceDate: "21 nov 2026",
    sourceUrl: "https://www.primicias.ec/sociedad/inamhi-prevision-lluvias-fuertes-costa-sierra-21noviembre-clima-137647/",
  },
  {
    title: "Estados Unidos lidera la compra de productos ecuatorianos y China se acerca",
    summary: "Entre enero y septiembre de 2026, las ventas ecuatorianas a Estados Unidos alcanzaron USD 6.253 millones; las dirigidas a China sumaron USD 5.388 millones.",
    body: "Según cifras del Banco Central citadas por Primicias, ambos destinos registraron un aumento interanual cercano al 25%. El camarón lideró las exportaciones a los dos mercados. Ecuador, sin embargo, mantuvo un saldo comercial negativo con ambos países.",
    category: "Económico",
    national: true,
    image: "https://imagenes.primicias.ec/files/image_480_270/uploads/2026/11/17/6afcdfea1a0cd.jpeg",
    images: [
      "https://imagenes.primicias.ec/files/image_480_270/uploads/2026/11/17/6afcdfea1a0cd.jpeg",
      "https://imagenes.primicias.ec/files/image_480_270/uploads/2026/11/16/6afb4432a091a.jpeg",
    ],
    isDemo: true,
    isLocalDraft: false,
    sourceName: "Primicias",
    sourceDate: "18 nov 2026",
    sourceUrl: "https://www.primicias.ec/economia/comercio-ecuador-estados-unidos-petroleo-china-camaron-oro-exportaciones-importaciones-137347/",
  },
  {
    title: "Debate por la Alcaldía de Quito dejó acusaciones y pocas propuestas, según Primicias",
    summary: "El medio describió un intercambio tenso entre candidaturas y señaló que no hubo un cara a cara entre Pabel Muñoz y Jorge Yunda.",
    body: "El encuentro ocurrió antes de las elecciones seccionales adelantadas. La cobertura revisa los planteamientos sobre el futuro de la ciudad y los cruces entre los aspirantes.",
    category: "Político",
    province: "Pichincha",
    city: "Quito",
    image: "https://imagenes.primicias.ec/files/image_480_270/uploads/2026/11/22/6b03a92f0e193.jpeg",
    images: [
      "https://imagenes.primicias.ec/files/image_480_270/uploads/2026/11/22/6b03a92f0e193.jpeg",
      "https://imagenes.primicias.ec/files/content_image_simple_414_238/uploads/2026/11/22/6b03ab3c1dc81.jpeg",
      "https://imagenes.primicias.ec/files/content_image_simple_414_238/uploads/2026/11/22/6b03ada769a7c.jpeg",
    ],
    isDemo: true,
    isLocalDraft: false,
    sourceName: "Primicias",
    sourceDate: "23 nov 2026",
    sourceUrl: "https://www.primicias.ec/politica/elecciones/seccionales-adelantadas-2027/debate-candidatos-alcaldia-quito-debate-cne-elecciones-seccionales-137694/",
  },
  {
    title: "La inundación en Santa Cruz dejó más de 2.000 personas afectadas",
    summary: "Una crónica de EL PAÍS relata cómo vecinos y equipos de emergencia auxiliaron a familias durante las lluvias vinculadas a El Niño en Galápagos.",
    body: "El reportaje recoge testimonios de residentes y describe las labores de rescate y ayuda comunitaria en Puerto Ayora, tras las inundaciones del 1 de noviembre.",
    category: "Crónica",
    province: "Galápagos",
    city: "Puerto Baquerizo Moreno",
    image: "https://imagenes.elpais.com/resizer/v2/CJ6CWMXVGNJHNHA6FB3TTLD3MA.jpg?auth=6cd68f2e3eef0a0fbf5d2fb6422352bfec9417b9c8d5c22deecc4129561be4d1&width=414",
    images: [
      "https://imagenes.elpais.com/resizer/v2/CJ6CWMXVGNJHNHA6FB3TTLD3MA.jpg?auth=6cd68f2e3eef0a0fbf5d2fb6422352bfec9417b9c8d5c22deecc4129561be4d1&width=414",
      "https://imagenes.elpais.com/resizer/v2/RJLHZC3J4ZPTXH47UNJ4V5QV4E.jpg?auth=014e459751ed292bd6e2473823e48dc7907ea8ef6c9eeb3c99024cee94a96087&width=414",
    ],
    isDemo: true,
    isLocalDraft: false,
    sourceName: "EL PAÍS América Futura",
    sourceDate: "4 nov 2026",
    sourceUrl: "https://elpais.com/america-futura/2026-11-04/el-nino-provoca-un-muerto-y-mas-2000-afectados-en-galapagos.html",
  },
];

function demoStory(index: number): Story {
  return { ...demoStories[index % demoStories.length], id: `demo-${index}` };
}

function StoryImageCarousel({ story, onDoubleTap, heartPulseKey }: { story: Story; onDoubleTap?: () => void; heartPulseKey?: number }) {
  const imageList = story.images?.length ? story.images : [story.image];
  const [activeImage, setActiveImage] = useState(0);
  const handleCarouselKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (imageList.length < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((current) => (current + (event.key === "ArrowRight" ? 1 : -1) + imageList.length) % imageList.length);
  };
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") touchStartRef.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (event.pointerType !== "touch" || !start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
    const now = Date.now();
    if (now - lastTapRef.current < 360) onDoubleTap?.();
    lastTapRef.current = now;
  };

  return (
    <div className={styles.storyGallery} role="group" aria-label={`Galería de ${story.title}`} aria-roledescription="carrusel" tabIndex={imageList.length > 1 ? 0 : undefined} onKeyDown={handleCarouselKeyDown}>
      <div
        className={styles.postImage}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onDoubleClick={onDoubleTap}
      >
        <Image key={imageList[activeImage]} src={imageList[activeImage]} alt={`Foto ${activeImage + 1} de ${story.title}`} fill sizes="(max-width: 720px) 100vw, 680px" unoptimized={imageList[activeImage].startsWith("blob:") || imageList[activeImage].startsWith("http")} />
        {heartPulseKey !== undefined && heartPulseKey > 0 && <Heart key={heartPulseKey} className={styles.doubleTapHeart} size={76} fill="currentColor" aria-hidden="true" />}
      </div>
      {imageList.length > 1 && <div className={styles.carouselDots} role="group" aria-label="Seleccionar fotografía">
        {imageList.map((imageUrl, index) => <button key={`${imageUrl}-${index}`} type="button" className={activeImage === index ? styles.activeDot : undefined} aria-label={`Mostrar foto ${index + 1} de ${imageList.length}`} aria-pressed={activeImage === index} onClick={() => setActiveImage(index)} />)}
      </div>}
    </div>
  );
}

function StoryMetadata({ story }: { story: Story }) {
  const timestamp = story.createdAt ?? story.sourceDate;
  return <div className={styles.storyMeta}>
    {timestamp && <span><CalendarDays size={14} aria-hidden="true" /><RelativeTimestamp value={timestamp} live={Boolean(story.createdAt)} /></span>}
  </div>;
}

function StoryBylineMetadata({ story }: { story: Story }) {
  const CategoryIcon = topicIcons[story.category] ?? Newspaper;
  const storyLocation = story.city ?? story.province ?? (story.provinces?.length ? "Varias provincias" : "Ecuador");
  return <span className={styles.bylineMeta}>
    <span><MapPin size={12} aria-hidden="true" />{storyLocation}</span>
    <span className={styles.metaDivider} aria-hidden="true" />
    <span><CategoryIcon size={12} aria-hidden="true" />{story.category}</span>
  </span>;
}

function StoryDetailsModal({ story, onClose }: { story: Story; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]");
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="story-details-title" tabIndex={-1}>
        <div className={styles.modalHeader}>
          <div><p className={styles.asideLabel}>LECTURA AMPLIADA</p><h2 id="story-details-title">{story.title}</h2></div>
          <button className={styles.closeButton} type="button" aria-label="Cerrar noticia" onClick={onClose}><X size={20} /></button>
        </div>
        <div className={styles.detailSource}>
          {story.sourceName && <span><Newspaper size={14} aria-hidden="true" />{story.sourceName}</span>}
          <span><CalendarDays size={14} aria-hidden="true" />{story.sourceDate ?? "Borrador local"}</span>
        </div>
        <StoryImageCarousel story={story} />
        <div className={styles.detailCopy}>
          <p className={styles.storySummary}>{story.summary}</p>
          {story.body && <p className={styles.storyBody}>{story.body}</p>}
          {story.sourceUrl && <p className={styles.infoSmall}>Esta es una síntesis editorial. Consulta la publicación original para leer el reportaje completo.</p>}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.secondaryButton} type="button" onClick={onClose}>Cerrar</button>
          {story.sourceUrl && <a className={styles.primaryButton} href={story.sourceUrl} target="_blank" rel="noreferrer">Leer fuente original<ArrowRight size={16} aria-hidden="true" /></a>}
        </div>
      </section>
    </div>
  );
}

function NewsPost({ story }: { story: Story }) {
  const [liked, setLiked] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [heartPulseKey, setHeartPulseKey] = useState(0);
  const fullText = `${story.summary} ${story.body}`.trim();
  const showReadMore = fullText.length > 180 || Boolean(story.sourceUrl);
  const previewText = fullText.length > 180 ? `${fullText.slice(0, 177).trimEnd()}…` : fullText;
  const likeFromPhoto = () => {
    setLiked(true);
    setHeartPulseKey((current) => current + 1);
  };

  return (
    <article className={styles.post}>
      <div className={styles.postHeader}>
        <span className={styles.avatarPlaceholder} aria-hidden="true"><UserRound size={22} strokeWidth={1.6} /></span>
        <div className={styles.byline}>
          <span className={styles.bylineName}>{story.isDemo ? story.sourceName : story.isLocalDraft ? "Borrador local" : "Redacción"}</span>
          <StoryBylineMetadata story={story} />
        </div>
        {(story.isDemo || story.createdAt) && <StoryMetadata story={story} />}
      </div>

      <div className={styles.postContent}>
        {story.isLocalDraft && <span className={styles.demoBadge}>Borrador local — no publicado</span>}
        <h2 className={styles.storyTitle}>{story.title}</h2>
        {story.imageVerification?.classification && <p className={styles.modelResult}>
          El clasificador estima que la imagen es {story.imageVerification.classification === "PROBABLE_AI" ? "probablemente generada por IA" : "probablemente real"} (puntaje {story.imageVerification.score?.toFixed(3)}). Esto no verifica la noticia.
        </p>}
        <p className={styles.storyExcerpt}>{previewText}{showReadMore && <button className={styles.readMoreButton} type="button" onClick={() => setIsDetailsOpen(true)}>Ver más</button>}</p>
      </div>
      <StoryImageCarousel story={story} onDoubleTap={likeFromPhoto} heartPulseKey={heartPulseKey} />

      <div className={styles.postActions}>
        <button
          className={liked ? styles.liked : undefined}
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Quitar me gusta" : "Me gusta"}
          onClick={() => setLiked((value) => !value)}
        >
          <Heart size={18} strokeWidth={1.8} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      </div>
      {isDetailsOpen && <StoryDetailsModal story={story} onClose={() => setIsDetailsOpen(false)} />}
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
      setImage(parsed.data.imageUrl);
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
    onCreate({ id: `draft-${crypto.randomUUID()}`, title, summary: summary.trim(), body: body.trim(), category, image, isDemo: false, isLocalDraft: true, createdAt: new Date().toISOString(), imageVerification: imageVerification ?? undefined });
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
          <label htmlFor="image-upload">Fotografía de la noticia (JPEG, PNG o WebP; hasta 10 MB)</label>
          <input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ""; void selectImageFile(file); }} />
          {imageFile && <p className={styles.formHint}>Imagen seleccionada: {imageFile.name}. Se guardará en el servidor local de archivos.</p>}
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
  const [selectedTopic, setSelectedTopic] = useState("Todo");
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection>({ kind: "country" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const feedRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const locationManuallySelectedRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (locationManuallySelectedRef.current) return;
        const isInsideEcuador = coords.latitude >= -5.2 && coords.latitude <= 1.8 && coords.longitude >= -81.2 && coords.longitude <= -75;
        const isInGalapagos = coords.latitude >= -1.5 && coords.latitude <= 1.5 && coords.longitude >= -92 && coords.longitude <= -89;
        if (!isInsideEcuador && !isInGalapagos) return;
        const longitudeScale = Math.cos((coords.latitude * Math.PI) / 180);
        const closestCity = ecuadorCities.reduce((closest, city) => {
          const cityDistance = Math.hypot((city.latitude - coords.latitude) * 111, (city.longitude - coords.longitude) * 111 * longitudeScale);
          const closestDistance = Math.hypot((closest.latitude - coords.latitude) * 111, (closest.longitude - coords.longitude) * 111 * longitudeScale);
          return cityDistance < closestDistance ? city : closest;
        });
        setSelectedLocation({ kind: "city", city: closestCity.city, province: closestCity.province });
        setSelectedTopic("Local");
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }, []);
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

  const matchesLocation = (story: Story) => {
    if (selectedLocation.kind === "country" || story.national) return true;
    if (selectedLocation.kind === "province") return story.province === selectedLocation.province || story.provinces?.includes(selectedLocation.province ?? "") === true;
    return story.city === selectedLocation.city || story.province === selectedLocation.province || story.provinces?.includes(selectedLocation.province ?? "") === true;
  };
  const visiblePosts = posts.filter((post) => (selectedTopic === "Todo" || selectedTopic === "Local" || post.category === selectedTopic) && (selectedTopic !== "Local" || matchesLocation(post)));
  const handleProvinceChange = (province: string) => {
    locationManuallySelectedRef.current = true;
    setSelectedLocation(province ? { kind: "province", province } : { kind: "country" });
    setSelectedTopic("Local");
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  const handleCityChange = (city: string) => {
    if (!city) {
      locationManuallySelectedRef.current = true;
      if (selectedLocation.province) setSelectedLocation({ kind: "province", province: selectedLocation.province });
      setSelectedTopic("Local");
      feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const cityEntry = ecuadorCities.find((entry) => entry.city === city);
    if (!cityEntry) return;
    locationManuallySelectedRef.current = true;
    setSelectedLocation({ kind: "city", city: cityEntry.city, province: cityEntry.province });
    setSelectedTopic("Local");
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  const selectTopic = (topic: string) => {
    setSelectedTopic(topic);
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  const addStory = (story: Story) => {
    setPosts((current) => [story, ...current]);
    setSelectedTopic("Todo");
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
            {topics.map((topic) => { const TopicIcon = topicIcons[topic]; return <button key={topic} type="button" className={selectedTopic === topic ? styles.activeTopic : undefined} aria-pressed={selectedTopic === topic} onClick={() => selectTopic(topic)}><TopicIcon size={17} strokeWidth={1.8} aria-hidden="true" />{topic}</button>; })}
          </nav>
          <button className={styles.sideCreateButton} type="button" onClick={() => setIsModalOpen(true)}><Plus size={16} aria-hidden="true" />Crear noticia</button>
        </aside>

        <section ref={feedRef} className={styles.feed} id="inicio" aria-label="Noticias. Usa las flechas arriba o abajo, Av Pág o Espacio para cambiar de publicación." tabIndex={0}>
          {visiblePosts.length === 0 && <div className={styles.emptyFeed}><MapPin size={20} aria-hidden="true" /><p>No hay noticias de {locationLabel(selectedLocation)} en esta muestra.</p><span>Prueba otra provincia o ciudad desde el selector de ubicación.</span></div>}
          {visiblePosts.map((story) => <NewsPost key={story.id} story={story} />)}
          <div ref={sentinelRef} className={styles.feedEnd} aria-live="polite">{isLoadingMore ? <><LoaderCircle size={18} aria-hidden="true" /><span>Cargando publicaciones de prueba</span></> : <span>Desplázate para ver más publicaciones de prueba</span>}</div>
        </section>

        <aside className={styles.rightAside} aria-label="Información del feed">
          <section className={styles.infoCard} aria-live="polite">
            <p className={styles.asideLabel}>TU UBICACIÓN</p>
            <label className={styles.locationPicker}>
              <span>Provincia</span>
              <span className={styles.locationSelectWrap}><MapPin size={15} aria-hidden="true" /><select aria-label="Elegir provincia" value={selectedLocation.province ?? ""} onChange={(event) => handleProvinceChange(event.target.value)}>
                <option value="">General · Ecuador</option>
                {ecuadorProvinces.map((province) => <option key={province} value={province}>{province}</option>)}
              </select></span>
              <span>Ciudad</span>
              <span className={styles.locationSelectWrap}><MapPin size={15} aria-hidden="true" /><select aria-label="Elegir ciudad" value={selectedLocation.kind === "city" ? selectedLocation.city : ""} disabled={!selectedLocation.province} onChange={(event) => handleCityChange(event.target.value)}>
                <option value="">{selectedLocation.province ? "Toda la provincia" : "Todas las ciudades"}</option>
                {ecuadorCities.filter(({ province }) => province === selectedLocation.province).map(({ city }) => <option key={city} value={city}>{city}</option>)}
              </select></span>
            </label>
          </section>
          <p className={styles.footerNote}><Eye size={14} aria-hidden="true" />Lectura abierta <span>Sin cuenta</span></p>
        </aside>
      </div>
      {isModalOpen && <CreateStoryModal onClose={() => setIsModalOpen(false)} onCreate={addStory} />}
    </main>
  );
}
