export type FontPair = { key: string; label: string; display: string; body: string; preview: string };

export const FONT_PAIRS: FontPair[] = [
  { key: "jakarta", label: "Klasik Venue", display: '"Fraunces", Georgia, serif', body: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif', preview: "Fraunces + Jakarta" },
  { key: "playfair", label: "Elegan Emas", display: '"Playfair Display", Georgia, serif', body: '"Inter", ui-sans-serif, system-ui, sans-serif', preview: "Playfair + Inter" },
  { key: "poppins", label: "Modern Bersih", display: '"Poppins", ui-sans-serif, system-ui, sans-serif', body: '"Poppins", ui-sans-serif, system-ui, sans-serif', preview: "Poppins" },
  { key: "lora", label: "Hangat Buku", display: '"Lora", Georgia, serif', body: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif', preview: "Lora + Source Sans" },
  { key: "bebas", label: "Sporty TV", display: '"Bebas Neue", "Arial Narrow", sans-serif', body: '"Inter", ui-sans-serif, system-ui, sans-serif', preview: "Bebas + Inter" },
];

export function fontPair(key: string | null | undefined): FontPair {
  return FONT_PAIRS.find((f) => f.key === key) ?? FONT_PAIRS[0];
}

export type SurfaceMode = "light" | "cream" | "dark";
export type RadiusMode = "soft" | "md" | "sharp";
export type CardStyle = "solid" | "glass" | "outline";

export const SURFACES: { key: SurfaceMode; label: string; desc: string }[] = [
  { key: "light", label: "Terang", desc: "Kertas krem klasik, paling kontras di siang hari." },
  { key: "cream", label: "Krem Hangat", desc: "Sedikit lebih gelap, nyaman untuk sesi panjang." },
  { key: "dark", label: "Gelap", desc: "Cocok untuk venue redup & layar TV." },
];
export const RADII: { key: RadiusMode; label: string; px: string }[] = [
  { key: "soft", label: "Membulat", px: "28px" },
  { key: "md", label: "Sedang", px: "18px" },
  { key: "sharp", label: "Tegas", px: "10px" },
];
export const CARDS: { key: CardStyle; label: string; desc: string }[] = [
  { key: "solid", label: "Solid", desc: "Kartu penuh dengan bayangan lembut." },
  { key: "glass", label: "Kaca", desc: "Transparan blur, terlihat mewah." },
  { key: "outline", label: "Garis", desc: "Rata tanpa bayangan, ringan." },
];

export type LeaderboardStyleKey = "podium" | "klasemen" | "kartu" | "minimal";
export const LEADERBOARD_STYLES: { key: LeaderboardStyleKey; label: string; desc: string }[] = [
  { key: "podium", label: "Podium Juara", desc: "Juara 1–3 tampil besar." },
  { key: "klasemen", label: "Klasemen TV", desc: "Baris rapat ala layar TV." },
  { key: "kartu", label: "Kartu Pemain", desc: "Satu kartu per pemain + statistik." },
  { key: "minimal", label: "Minimal", desc: "Daftar bersih fokus angka." },
];
export function leaderboardStyle(key: string | null | undefined): LeaderboardStyleKey {
  return (LEADERBOARD_STYLES.some((x) => x.key === key) ? key : "podium") as LeaderboardStyleKey;
}

export type ThemeInput = {
  primaryColor: string;
  accentColor?: string | null;
  fontPair?: string | null;
  surfaceMode?: string | null;
  radiusMode?: string | null;
  cardStyle?: string | null;
};

/** Tema bawaan WinMahjong. Kustom tema sementara dinonaktifkan agar layar meja/modal tidak bergeser. */
export function themeCss(v: ThemeInput): string {
  void v;
  return "";
  const fp = fontPair(v.fontPair);
  const surface = (SURFACES.find((s) => s.key === v.surfaceMode) ?? SURFACES[0]).key;
  const radius = (RADII.find((r) => r.key === v.radiusMode) ?? RADII[0]).px;
  const brand = v.primaryColor || "#0f5132";
  const accent = v.accentColor || "#d4a73d";
  const dark = surface === "dark";
  const page = dark ? "#071711" : surface === "cream" ? "#f3ecdc" : "#f8f3e7";
  // Kartu tidak boleh transparan; teks di modal & kontrol tetap tajam di semua tema.
  const cardBg = dark ? "#0c231b" : "#ffffff";
  const cardLine = dark ? "rgba(255,255,255,0.14)" : "rgba(11,63,40,0.10)";
  const shadow = v.cardStyle === "outline" ? "none" : dark ? "0 10px 30px -18px rgba(0,0,0,.8)" : "0 1px 2px rgba(8,46,30,.04), 0 12px 32px -18px rgba(8,46,30,.25)";
  const text = dark ? "#e8f2ec" : "#17231c";
  const muted = dark ? "rgba(232,242,236,0.62)" : "rgba(23,35,28,0.6)";
  return `
.themed{--brand:${brand};--accent:${accent};--radius:${radius};--page:${page};--card:${cardBg};--card-line:${cardLine};--tx:${text};--tx-muted:${muted};
  background:${page};color:${text};font-family:${fp.body};
}
.themed .font-display,.themed h1,.themed h2,.themed h3{font-family:${fp.display}}
.themed .card{background:${cardBg};border:1px solid ${cardLine};border-radius:${radius};box-shadow:${shadow};color:${text}}
.themed .input{background:${dark ? "rgba(255,255,255,0.06)" : "#fdfbf6"};color:${text};border-color:${cardLine};border-radius:calc(${radius} - 8px)}
.themed .input::placeholder{color:${muted}}
.themed .label{color:${muted}}
.themed .btn-primary{background:${brand};border-radius:calc(${radius} - 8px)}
.themed .btn-ghost{border-color:${cardLine};color:${text};border-radius:calc(${radius} - 8px)}
.themed .btn-ghost:hover{background:${dark ? "rgba(255,255,255,0.08)" : "#fff"}}
.themed .text-felt-950,.themed .text-felt-900{color:${text}}
.themed .text-felt-900\/70,.themed .text-felt-900\/65,.themed .text-felt-900\/60,.themed .text-felt-900\/55,.themed .text-felt-900\/50{color:${muted}}
.themed .text-felt-800{color:${dark ? "#cfe4d9" : "#0b3f28"}}
.themed .text-felt-700{color:${dark ? "#8fd6ae" : "#156341"}}
.themed .bg-cream-100,.themed .bg-cream-50{background:${dark ? "rgba(255,255,255,0.06)" : "rgba(11,63,40,0.05)"}}
.themed .bg-white{background:${cardBg}}
.themed .ring-felt-900\/10,.themed .ring-felt-900\/8{--tw-ring-color:${cardLine}}
.themed .border-felt-900\/10,.themed .border-felt-900\/8,.themed .border-felt-900\/6,.themed .border-felt-900\/5{border-color:${cardLine}}
.themed .divide-felt-900\/5>*+*,.themed .divide-felt-900\/6>*+*{border-color:${cardLine}}
.themed .chip{border-radius:999px}
.themed table{color:${text}}
.themed .felt{background-color:${brand};
  background-image:radial-gradient(ellipse 80% 60% at 50% 0%, ${accent}22, transparent 70%),
    radial-gradient(circle at 15% 85%, ${accent}14, transparent 40%);}
.themed .gold-text{background:linear-gradient(180deg,${accent},${accent});-webkit-background-clip:text;background-clip:text;color:transparent}
@media (max-width:640px){.themed{--radius:${radius === "28px" ? "22px" : radius}}}
`;
}
