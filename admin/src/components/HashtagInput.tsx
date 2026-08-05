import { Hash, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type SocialPlatform = "instagram" | "facebook" | "x";

export interface HashtagEntry {
  tag: string;
  platforms: SocialPlatform[];
}

interface HashtagInputProps {
  value: HashtagEntry[];
  onChange: (value: HashtagEntry[]) => void;
  maxTags?: number;
}

const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
];

export function normalizeHashtag(value: string) {
  return value
    .trim()
    .replace(/^#+/, "")
    .toLocaleLowerCase("es")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, 32);
}

export function normalizeHashtagEntries(value: unknown): HashtagEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): HashtagEntry[] => {
    if (typeof entry === "string") {
      const tag = normalizeHashtag(entry);
      return tag ? [{ tag, platforms: [] }] : [];
    }
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as { tag?: unknown; platforms?: unknown };
    const tag = normalizeHashtag(typeof candidate.tag === "string" ? candidate.tag : "");
    if (!tag) return [];
    const platforms = Array.isArray(candidate.platforms)
      ? candidate.platforms.filter((platform): platform is SocialPlatform =>
          SOCIAL_PLATFORMS.some(({ id }) => id === platform),
        )
      : [];
    return [{ tag, platforms: [...new Set(platforms)] }];
  });
}

export function hashtagUrl(platform: SocialPlatform, tag: string) {
  const encoded = encodeURIComponent(normalizeHashtag(tag));
  if (platform === "instagram") return `https://www.instagram.com/explore/tags/${encoded}/`;
  if (platform === "facebook") return `https://www.facebook.com/hashtag/${encoded}`;
  return `https://x.com/hashtag/${encoded}`;
}

function SocialIcon({ platform, size = 14 }: { platform: SocialPlatform; size?: number }) {
  if (platform === "instagram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (platform === "facebook") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 8.5V7c0-.8.5-1 1-1h2V2.2A18 18 0 0 0 14.1 2C11.2 2 9 3.8 9 7.2v1.3H6v4h3V22h5v-9.5h3.3l.7-4H14Z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 4 19 20M19 4 5 20" />
    </svg>
  );
}

export function HashtagLinks({
  value,
  limit = 4,
}: {
  value: unknown;
  limit?: number;
}) {
  const entries = normalizeHashtagEntries(value).slice(0, limit);
  if (!entries.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map((entry) => {
        const firstPlatform = entry.platforms[0];
        return (
          <span key={entry.tag} className="inline-flex items-center overflow-hidden rounded-lg bg-primary/10 text-[11px] font-semibold text-primary ring-1 ring-primary/18">
            {firstPlatform ? (
              <a
                href={hashtagUrl(firstPlatform, entry.tag)}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 transition-colors hover:bg-primary/12"
                aria-label={`Buscar ${entry.tag} en ${firstPlatform}`}
              >
                #{entry.tag}
              </a>
            ) : (
              <span className="px-2 py-1">#{entry.tag}</span>
            )}
            {entry.platforms.length > 0 && (
              <span className="flex items-center border-l border-primary/20 px-1">
                {entry.platforms.map((platform) => (
                  <a
                    key={platform}
                    href={hashtagUrl(platform, entry.tag)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-6 items-center justify-center rounded-md text-primary/75 transition-colors hover:bg-primary/15 hover:text-primary"
                    aria-label={`Abrir #${entry.tag} en ${SOCIAL_PLATFORMS.find(({ id }) => id === platform)?.label}`}
                  >
                    <SocialIcon platform={platform} size={12} />
                  </a>
                ))}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function HashtagInput({ value, onChange, maxTags = 10 }: HashtagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (candidate: string) => {
    const tag = normalizeHashtag(candidate);
    if (!tag || value.some((entry) => entry.tag === tag) || value.length >= maxTags) return;
    onChange([...value, { tag, platforms: [] }]);
  };

  const commitDraft = () => {
    addTag(draft);
    setDraft("");
  };

  const togglePlatform = (tag: string, platform: SocialPlatform) => {
    onChange(
      value.map((entry) =>
        entry.tag === tag
          ? {
              ...entry,
              platforms: entry.platforms.includes(platform)
                ? entry.platforms.filter((current) => current !== platform)
                : [...entry.platforms, platform],
            }
          : entry,
      ),
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", " ", ",", "Tab"].includes(event.key) && draft.trim()) {
      event.preventDefault();
      commitDraft();
      return;
    }
    if (event.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const candidates = event.clipboardData.getData("text").split(/[\s,]+/).filter(Boolean);
    if (candidates.length < 2) return;
    event.preventDefault();
    const next = [...value];
    candidates.forEach((candidate) => {
      const tag = normalizeHashtag(candidate);
      if (tag && !next.some((entry) => entry.tag === tag) && next.length < maxTags) {
        next.push({ tag, platforms: [] });
      }
    });
    onChange(next);
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-input bg-background/60 p-2 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring">
      <div className="flex min-h-8 flex-wrap items-center gap-2 px-1">
        {value.map((entry) => (
          <span key={entry.tag} className="inline-flex items-center gap-1 rounded-lg bg-primary/12 px-2 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
            #{entry.tag}
            {entry.platforms.map((platform) => <SocialIcon key={platform} platform={platform} size={11} />)}
            <button
              type="button"
              onClick={() => onChange(value.filter((current) => current.tag !== entry.tag))}
              className="rounded p-0.5 text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary"
              aria-label={`Quitar etiqueta ${entry.tag}`}
            >
              <X size={11} aria-hidden="true" />
            </button>
          </span>
        ))}

        {value.length < maxTags && (
          <label className="flex min-w-36 flex-1 items-center gap-1.5 px-1 text-muted-foreground">
            <Hash size={14} className="shrink-0" aria-hidden="true" />
            <span className="sr-only">Nueva etiqueta</span>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value.replace(/^#+/, ""))}
              onKeyDown={handleKeyDown}
              onBlur={commitDraft}
              onPaste={handlePaste}
              placeholder={value.length ? "Otra etiqueta" : "infantil"}
              className="min-w-24 flex-1 border-0 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </label>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border/70 pt-2">
          {value.map((entry) => (
            <div key={entry.tag} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/45">
              <span className="min-w-24 text-xs font-semibold text-primary">#{entry.tag}</span>
              <div className="flex flex-wrap gap-1" aria-label={`Redes para ${entry.tag}`}>
                {SOCIAL_PLATFORMS.map((platform) => {
                  const selected = entry.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => togglePlatform(entry.tag, platform.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
                        selected
                          ? "border-primary/30 bg-primary/12 text-primary"
                          : "border-border bg-background/35 text-muted-foreground hover:border-primary/25 hover:text-foreground",
                      )}
                    >
                      <SocialIcon platform={platform.id} size={12} />
                      {platform.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 px-1 text-[11px] text-muted-foreground">
        Escribe una etiqueta y pulsa espacio o Enter · {value.length}/{maxTags}
      </p>
    </div>
  );
}
