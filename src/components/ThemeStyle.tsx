type Fields = {
  primaryColor?: string | null;
  accentColor?: string | null;
  fontPair?: string | null;
  surfaceMode?: string | null;
  radiusMode?: string | null;
  cardStyle?: string | null;
};

/** Antarmuka dipertahankan untuk kompatibilitas. Injeksi tema sementara dinonaktifkan. */
export default function ThemeStyle(_props: Fields & { venue?: Fields }) {
  return null;
}
