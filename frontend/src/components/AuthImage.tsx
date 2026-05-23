import { useEffect, useState } from "react";
import { apiAssetUrl } from "../lib/api";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

/** Imagen del API autenticado (cookies) vía fetch + blob URL. */
export function AuthImage({ src, alt = "", className, ...rest }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src || src.startsWith("blob:")) {
      setBlobUrl(src.startsWith("blob:") ? src : null);
      setFailed(!src);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const url = src.startsWith("http") ? src : apiAssetUrl(src);

    void (async () => {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setFailed(false);
      } catch {
        if (!cancelled) {
          setBlobUrl(null);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed || !blobUrl) {
    return (
      <span
        className={`flex items-center justify-center bg-[var(--velo-bg)] text-[10px] font-medium text-[var(--velo-text-subtle)] ${className ?? ""}`}
        aria-hidden={!alt}
      >
        {failed ? "Sin imagen" : "…"}
      </span>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} {...rest} />;
}
