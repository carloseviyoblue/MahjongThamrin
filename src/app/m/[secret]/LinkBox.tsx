"use client";

import { Icon, useToast } from "@/components/ui";

export default function LinkBox({ label, url }: { label: string; url: string }) {
  const toast = useToast();
  const short = url.replace(/^https?:\/\/[^/]+/, "");

  return (
    <div className="card flex items-center justify-between gap-2 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-felt-900/45">{label}</p>
        <p className="truncate text-[13px] font-medium text-felt-900/85" title={url}>{short}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              toast(`${label} disalin`);
            } catch {
              toast("Gagal menyalin", "err");
            }
          }}
          className="rounded-lg p-2 text-felt-700 hover:bg-felt-50"
          aria-label={`Salin ${label}`}
        >
          <Icon name="copy" className="h-4 w-4" />
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-felt-700 hover:bg-felt-50" aria-label={`Buka ${label}`}>
          <Icon name="arrowRight" className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
