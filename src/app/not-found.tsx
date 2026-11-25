import Link from "next/link";
import { BrandMark, Tile } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="felt flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center text-cream-50">
      <BrandMark dark />
      <div className="flex gap-2">
        <Tile code="wN" size="lg" />
        <Tile code="dW" size="lg" />
        <Tile code="wN" size="lg" />
      </div>
      <div>
        <h1 className="font-display text-4xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-cream-50/60">Tile ini tidak ada di dinding. Periksa lagi alamat atau kode room.</p>
      </div>
      <Link href="/" className="btn-gold">Kembali ke beranda</Link>
    </div>
  );
}
