import type { GameType } from "./rules";

export type GuideSection = { title: string; body: string[]; list?: string[] };
export type Guide = {
  type: GameType;
  title: string;
  subtitle: string;
  intro: string;
  facts: { label: string; value: string }[];
  sections: GuideSection[];
  scoring: { name: string; zh: string; value: string; note: string }[];
  payout: string[];
  faq: { q: string; a: string }[];
};

export const GUIDES: Record<GameType, Guide> = {
  classic: {
    type: "classic",
    title: "Hong Kong Classic",
    subtitle: "港式經典 · 13 tile, 4 set + 1 pasang, minimum 3 faan",
    intro:
      "Hong Kong Classic adalah gaya mahjong Kanton yang paling umum dimainkan di Hong Kong, Makau, dan komunitas Tionghoa perantauan. Permainan memakai 136 tile (144 dengan bunga). Tujuanmu: menyusun 4 set + 1 pasang (14 tile) bernilai minimal 3 faan.",
    facts: [
      { label: "Pemain", value: "4 orang" },
      { label: "Tile di tangan", value: "13 (+1 saat giliran)" },
      { label: "Bentuk menang", value: "4 set + 1 pasang" },
      { label: "Minimum menang", value: "3 faan" },
      { label: "Batas (limit)", value: "10 faan" },
      { label: "Skala poin", value: "半辣上 Half Spicy" },
    ],
    sections: [
      {
        title: "1. Mengenal Tile",
        body: [
          "Ada tiga suit angka 1–9: Characters 萬 (wan), Bamboos 索/條, dan Dots 筒. Tile honor terdiri dari 4 Angin (東南西北) dan 3 Naga (中發白). Bunga 梅蘭菊竹 dan Musim 春夏秋冬 adalah tile bonus: tidak membentuk set, langsung dibuka dan diganti tile baru dari dinding.",
        ],
        list: ["Suit: 3 jenis × 9 angka × 4 tile = 108", "Angin: 4 jenis × 4 = 16", "Naga: 3 jenis × 4 = 12", "Bunga + Musim: 8 tile bonus (opsional)"],
      },
      {
        title: "2. Alur Giliran",
        body: [
          "Dealer adalah Timur. Setiap giliran: ambil 1 tile dari dinding, lalu buang 1 tile menghadap ke atas di area buangan. Pemain lain boleh mengklaim buangan itu untuk menang, kong, pung, atau — hanya pemain di sebelah kiri pembuang — untuk chow.",
        ],
        list: ["Chow 吃: urutan 3 angka satu suit, hanya dari pemain di kiri", "Pung 碰: 3 tile sama, dari buangan siapa pun", "Kong 槓: 4 tile sama, ambil tile pengganti dari ujung dinding", "Hu 糊: klaim buangan yang melengkapi tangan menangmu"],
      },
      {
        title: "3. Membentuk Tangan Menang",
        body: [
          "Tangan menang standar berisi 4 set (chow/pung/kong) dan 1 pasang mata. Pengecualian: Seven Pairs (7 pasang) dan Thirteen Orphans (13 tile yatim + 1 duplikat). Tangan harus mencapai minimum 3 faan — inilah yang membuat HK Classic menantang: tangan 'asal jadi' belum tentu boleh menang.",
        ],
      },
      {
        title: "4. Rotasi Dealer & Putaran",
        body: [
          "Jika dealer menang atau hand seri, dealer tetap (連莊). Jika pemain lain menang, dealer berpindah berlawanan arah jarum jam. Setelah dealer kembali ke pemain awal, putaran angin maju: Timur → Selatan → Barat → Utara. Satu permainan penuh = 4 putaran.",
        ],
      },
      {
        title: "5. Bunga & Musim (Penting!)",
        body: [
          "Bunga nomor 1 cocok untuk kursi Timur, 2 untuk Selatan, 3 untuk Barat, 4 untuk Utara. Bunga yang cocok dengan kursimu = 1 faan (正花). Jika lengkap 4 bunga ATAU 4 musim, nilainya 2 faan dan MENGGANTIKAN faan bunga kursi di dalam set itu — jangan dihitung dobel. Tidak punya bunga sama sekali = 1 faan (無花), hanya bila meja bermain dengan bunga. Mengumpulkan 7 bunga/musim = menang instan 花糊; 8 sekaligus = 八仙過海.",
        ],
      },
    ],
    scoring: [
      { name: "Chicken Hand", zh: "雞糊", value: "0", note: "Tidak diakui di Classic (di bawah minimum). Main di mode Basic." },
      { name: "Common Hand (All Chows)", zh: "平糊", value: "1", note: "Keempat set berupa chow." },
      { name: "Concealed Hand", zh: "門前清", value: "1", note: "Tanpa set terbuka, menang dari buangan." },
      { name: "Self Pick (Zimo)", zh: "自摸", value: "1", note: "Menang dari tile ambilan sendiri." },
      { name: "Dragon Pung", zh: "三元牌", value: "1 / set", note: "Pung naga merah/hijau/putih." },
      { name: "Seat / Round Wind Pung", zh: "門風/圈風", value: "1 / set", note: "Bila sama (Timur di putaran Timur) dihitung 2." },
      { name: "No Flowers", zh: "無花", value: "1", note: "Hanya bila meja memakai bunga." },
      { name: "Seat Flower", zh: "正花", value: "1 / tile", note: "Lihat aturan set di bagian 5." },
      { name: "Flower Set", zh: "一台花", value: "2 / set", note: "Menggantikan seat flower dalam set itu." },
      { name: "All in Triplets", zh: "對對糊", value: "3", note: "Keempat set pung/kong." },
      { name: "Mixed One Suit", zh: "混一色", value: "3", note: "Satu suit + honor." },
      { name: "Seven Pairs", zh: "七對子", value: "4", note: "House rule populer (tidak standar di semua meja)." },
      { name: "Small Dragons", zh: "小三元", value: "5", note: "Sudah termasuk 2 pung naga." },
      { name: "Small Winds", zh: "小四喜", value: "6", note: "Sudah termasuk 混一色; pung angin kursi/putaran boleh ditambah." },
      { name: "All One Suit", zh: "清一色", value: "7", note: "Satu suit penuh tanpa honor." },
      { name: "Great Dragons", zh: "大三元", value: "8", note: "Sudah termasuk 3 pung naga." },
      { name: "Limit Hands", zh: "例牌", value: "10", note: "字一色, 清么九, 九蓮寶燈, 十三么, 大四喜 dll — dibayar batas maksimum, tidak ditumpuk pola lain." },
    ],
    payout: [
      "Nilai dasar 半辣上: 0–4 faan = 1, 2, 4, 8, 16; lalu naik tiap 2 faan: 24, 32, 48, 64, 96, 128 (10 faan).",
      "Di WinMahjong nilai dasar dikali pengali venue (default ×2): 3 faan = 8 × 2 = 16 poin per bagian.",
      "半銃: menang dari buangan — pembuang bayar 2 bagian, dua pemain lain 1 bagian. 全銃: pembuang bayar semua (4 bagian versi dasar, di aplikasi 2× nilai penuh).",
      "Zimo: ketiga lawan masing-masing bayar 1 bagian penuh.",
    ],
    faq: [
      { q: "Bolehkah menang di bawah 3 faan?", a: "Tidak di Classic. Tambah pola: zimo, tangan tertutup, pung naga/angin, atau bunga yang cocok." },
      { q: "Apakah Seven Pairs selalu sah?", a: "Tidak standar di semua meja Hong Kong. Di WinMahjong pola ini bisa dimatikan di Pengaturan venue." },
      { q: "Dealer menang, apa yang terjadi?", a: "Dealer tetap dan hand berikutnya dealer yang sama (連莊). Tidak ada bonus poin dealer di HK." },
    ],
  },
  new18: {
    type: "new18",
    title: "Hong Kong New 18",
    subtitle: "新章十八番 · Tabel faan modern (mahjonggame.hk)",
    intro:
      "New 18 (新章) adalah daftar faan modern yang dipakai banyak turnamen dan venue Hong Kong saat ini. Struktur permainan sama dengan Classic — 4 set + 1 pasang, minimum 3 faan — tetapi beberapa nilai diperbarui: Mixed Terminals 4 faan (sudah termasuk All Pungs), Win on Kong 2 faan, dan limit hingga 13 faan.",
    facts: [
      { label: "Pemain", value: "4 orang" },
      { label: "Tile di tangan", value: "13 (+1 saat giliran)" },
      { label: "Bentuk menang", value: "4 set + 1 pasang" },
      { label: "Minimum menang", value: "3 faan" },
      { label: "Batas (limit)", value: "13 faan" },
      { label: "Skala poin", value: "半辣上 Half Spicy" },
    ],
    sections: [
      {
        title: "1. Perbedaan dari Classic",
        body: ["Perbedaan utama ada pada nilai pola, bukan cara bermain. Pelajari tabel di bawah; pola bertanda ★ berbeda dari Classic."],
        list: [
          "★ Mixed Terminals 混么九 = 4 faan, sudah termasuk All Pungs 對對糊 (jangan ditambah lagi)",
          "★ Win on Kong 槓上開花 = 2 faan (1 untuk kong + 1 zimo)",
          "★ Four Concealed Triplets 坎坎糊 = 8 faan, menggantikan All Pungs + Concealed",
          "★ Thirteen Orphans & Great Winds = 13 faan (limit penuh)",
          "★ Nine Gates, All Honours, Pure Terminals = 10 faan (limit)",
        ],
      },
      {
        title: "2. Kombinasi yang Sah",
        body: ["Faan bersifat menumpuk kecuali limit hands. Contoh resmi: Half Flush + All Pungs = 3 + 3 = 6; Full Flush + All Pungs = 7 + 3 = 10; Small Dragons + Half Flush = 5 + 3 = 8; Small Four Winds di kursi & putaran Timur = 6 + 1 + 1 = 8."],
      },
      {
        title: "3. Bunga & Musim",
        body: ["Sama seperti Classic: seat flower 1 faan per tile yang cocok; set lengkap 4 bunga/musim = 2 faan dan menggantikan seat flower di dalam set; tanpa bunga = 1 faan (bila meja memakai bunga); 7 bunga = 花糊 menang instan; 8 bunga = 八仙過海."],
      },
      {
        title: "4. Alur Permainan",
        body: ["Identik dengan Classic: ambil–buang, klaim chow/pung/kong/hu, rotasi dealer berlawanan jarum jam, dealer tetap bila menang atau seri. Lihat panduan HK Classic untuk langkah lengkapnya."],
      },
    ],
    scoring: [
      { name: "Common Hand (All Chows)", zh: "平糊", value: "1", note: "Pasang boleh tile apa saja." },
      { name: "Concealed / Self Pick", zh: "門前清/自摸", value: "1", note: "Bonus kondisi menang." },
      { name: "Dragon / Wind Pung", zh: "三元/風牌", value: "1 / set", note: "Angin ganda (kursi=putaran) dihitung 2." },
      { name: "Robbing the Kong", zh: "搶槓", value: "1", note: "Menang dari tile yang akan di-kong." },
      { name: "Win on Last Tile", zh: "海底撈月", value: "1", note: "Tile terakhir dinding (+1 zimo terpisah)." },
      { name: "Win on Kong", zh: "槓上開花", value: "2", note: "★ Termasuk bonus zimo." },
      { name: "All Pungs / Half Flush", zh: "對對糊/混一色", value: "3", note: "Bisa digabung menjadi 混對 6." },
      { name: "Mixed Terminals", zh: "混么九", value: "4", note: "★ Sudah termasuk All Pungs." },
      { name: "Small Dragons", zh: "小三元", value: "5", note: "Sudah termasuk 2 pung naga." },
      { name: "Small Winds", zh: "小四喜", value: "6", note: "混一色 termasuk; angin kursi/putaran boleh ditambah." },
      { name: "Full Flush", zh: "清一色", value: "7", note: "Satu suit tanpa honor." },
      { name: "Great Dragons", zh: "大三元", value: "8", note: "Sudah termasuk 3 pung naga." },
      { name: "Four Concealed Triplets", zh: "坎坎糊", value: "8", note: "★ Menggantikan All Pungs + Concealed." },
      { name: "Double Kong Win", zh: "連槓開花", value: "8", note: "Dua kong beruntun lalu zimo." },
      { name: "Limit 10", zh: "字一色/清么九/九蓮寶燈", value: "10", note: "Dibayar sendiri, tidak ditumpuk." },
      { name: "Limit 13", zh: "十三么/大四喜/十八羅漢/天糊/地糊", value: "13", note: "Limit penuh New 18." },
    ],
    payout: [
      "半辣上: nilai dasar 1, 2, 4, 8, 16 (0–4 faan), lalu 24, 32, 48, 64, 96, 128, 192, 256, 384 hingga 13 faan.",
      "Pembayaran 半銃/全銃 dan zimo sama seperti Classic; atur pengali & tabel di Pengaturan venue.",
    ],
    faq: [
      { q: "Mengapa Mixed Terminals saya bukan 7 faan?", a: "Karena 4 faan 混么九 sudah termasuk All Pungs. Menambah 對對糊 3 lagi adalah kesalahan hitung yang umum." },
      { q: "Apakah Seven Pairs diakui?", a: "House rule (3–4 faan). Di WinMahjong default New 18 = 3 faan dan bisa dimatikan." },
    ],
  },
  taiwan: {
    type: "taiwan",
    title: "Taiwan 16 Tile",
    subtitle: "台灣十六張 · 16 tile, 5 set + 1 pasang, dihitung dengan 台",
    intro:
      "Mahjong Taiwan dimainkan dengan 16 tile di tangan — kamu menyusun 5 set + 1 pasang (17 tile saat menang). Skor dihitung dengan 台 (tai), bukan faan. Setiap tai bernilai poin yang disepakati (di WinMahjong: pengali per tai, default 10 poin/tai). Tidak ada minimum tai: tangan jadi apa pun boleh menang, tetapi tai menentukan bayaran.",
    facts: [
      { label: "Pemain", value: "4 orang" },
      { label: "Tile di tangan", value: "16 (+1 saat giliran)" },
      { label: "Bentuk menang", value: "5 set + 1 pasang" },
      { label: "Satuan skor", value: "台 (tai)" },
      { label: "Minimum menang", value: "Tidak ada" },
      { label: "Poin per tai", value: "Disepakati (default 10)" },
    ],
    sections: [
      {
        title: "1. Tile & Bunga",
        body: [
          "Set Taiwan memakai 144 tile termasuk 8 bunga/musim. Bunga dibuka, diganti tile baru, dan bernilai tai bila nomornya cocok dengan kursimu (Timur 1, Selatan 2, Barat 3, Utara 4). Kumpulkan 8 bunga/musim = 八仙過海, menang instan 8 tai.",
        ],
      },
      {
        title: "2. Alur Giliran",
        body: [
          "Sama seperti HK: ambil 1, buang 1; klaim chow (hanya dari kiri), pung, kong, atau hu. Bedanya kamu memegang 16 tile sehingga kombinasi lebih panjang dan permainan cenderung lebih cepat membentuk tangan besar.",
        ],
      },
      {
        title: "3. Tai Khusus Taiwan",
        body: ["Beberapa tai khas Taiwan yang tidak ada di HK:"],
        list: [
          "莊家 Dealer: menang saat jadi dealer = 1 tai; 連莊 tiap kemenangan beruntun dealer berikutnya +1 tai",
          "門清 Concealed 1 tai dan 自摸 Self-draw 1 tai — keduanya bisa digabung (門清自摸)",
          "全求人 All Exposed 2 tai: semua set terbuka dan menang dari buangan",
          "河底撈魚: menang dari buangan terakhir = 1 tai; 海底撈月: tile terakhir dinding = 1 tai",
          "平胡 Pinfu 2 tai: semua chow, pasang bukan naga/angin bernilai, bukan tile penentu ganda",
        ],
      },
      {
        title: "4. Pembayaran",
        body: [
          "Total tai × poin per tai. Contoh: 6 tai × 10 poin = 60 poin per bagian. 半銃: pembuang bayar 2 bagian, dua pemain lain 1 bagian; 全銃 pembuang bayar semua; zimo ketiga lawan bayar penuh. Aturan ini bisa diganti per room di WinMahjong.",
        ],
      },
    ],
    scoring: [
      { name: "Dealer", zh: "莊家", value: "1", note: "+1 per 連莊 berikutnya." },
      { name: "Concealed / Self Draw", zh: "門清/自摸", value: "1 + 1", note: "門清自摸 = 2 tai." },
      { name: "Dragon / Wind Pung", zh: "三元/風台", value: "1 / set", note: "Angin kursi & putaran masing-masing 1." },
      { name: "Seat Flower", zh: "花台", value: "1 / tile", note: "Nomor bunga = nomor kursi." },
      { name: "Pinfu", zh: "平胡", value: "2", note: "Semua chow + pasang non-nilai." },
      { name: "All Exposed", zh: "全求人", value: "2", note: "Semua set terbuka, hu dari buangan." },
      { name: "All Pungs", zh: "碰碰胡", value: "4", note: "5 set pung/kong." },
      { name: "Half Flush", zh: "混一色", value: "4", note: "Satu suit + honor." },
      { name: "Small Dragons", zh: "小三元", value: "4", note: "Termasuk 2 pung naga." },
      { name: "Four Concealed Triplets", zh: "四暗刻", value: "4", note: "Empat pung tertutup." },
      { name: "Full Flush", zh: "清一色", value: "8", note: "Satu suit penuh." },
      { name: "Great Dragons", zh: "大三元", value: "8", note: "Tiga pung naga." },
      { name: "Small Winds", zh: "小四喜", value: "8", note: "Tiga pung angin + pasang angin." },
      { name: "Eight Flowers", zh: "八仙過海", value: "8", note: "Menang instan." },
      { name: "All Honours / Great Winds", zh: "字一色/大四喜", value: "16", note: "Tangan limit Taiwan." },
      { name: "Heavenly / Earthly", zh: "天胡/地胡", value: "16", note: "Menang di awal permainan." },
    ],
    payout: ["Poin = total tai × pengali (default 10). Ubah pengali di Pengaturan → Aturan Faan (mode Taiwan).", "半銃/全銃/zimo mengikuti aturan bayar room, sama seperti mode HK."],
    faq: [
      { q: "Mengapa tile saya 17, bukan 14?", a: "Taiwan memakai 16 tile di tangan; saat menang kamu memegang 17 (5 set + 1 pasang)." },
      { q: "Apakah Seven Pairs ada di Taiwan?", a: "Tidak. Dengan 17 tile, bentuk standarnya selalu 5 set + 1 pasang." },
    ],
  },
  basic: {
    type: "basic",
    title: "Basic / Chicken Hand",
    subtitle: "雞糊入門 · Mode belajar: tangan apa pun boleh menang",
    intro:
      "Mode Basic dibuat untuk pemain baru dan permainan santai. Perbedaan utamanya: tidak ada minimum faan. Tangan 4 set + 1 pasang apa pun — termasuk Chicken Hand 雞糊 yang tidak punya pola khusus — sah untuk menang. Pola tetap dihitung agar pemain belajar mengenal faan sambil bermain.",
    facts: [
      { label: "Pemain", value: "4 orang" },
      { label: "Tile di tangan", value: "13 (+1 saat giliran)" },
      { label: "Bentuk menang", value: "4 set + 1 pasang (atau 7 pasang)" },
      { label: "Minimum menang", value: "0 faan (Chicken boleh)" },
      { label: "Batas (limit)", value: "10 faan" },
      { label: "Cocok untuk", value: "Pemula & keluarga" },
    ],
    sections: [
      {
        title: "1. Apa itu Chicken Hand?",
        body: [
          "雞糊 (Chicken Hand) adalah julukan untuk tangan yang 'jadi' tetapi tidak mengandung pola bernilai apa pun: campuran chow dan pung dari berbagai suit tanpa naga/angin bernilai. Di meja serius tangan ini tidak boleh menang (0 faan); di mode Basic tangan ini sah dan dibayar nilai dasar terkecil.",
        ],
      },
      {
        title: "2. Cara Bermain",
        body: ["Alur sama persis dengan HK Classic: ambil–buang, klaim chow/pung/kong/hu, dealer berpindah bila kalah. Bacalah panduan HK Classic untuk aturan lengkap, lalu kembali ke sini untuk tabel skor sederhananya."],
      },
      {
        title: "3. Tips Naik Kelas",
        body: ["Setelah nyaman, bidik pola mudah: pung naga (+1), pung angin kursimu (+1), zimo (+1), dan Mixed One Suit (+3). Tiga faan adalah tiket masuk mode Classic."],
      },
    ],
    scoring: [
      { name: "Chicken Hand", zh: "雞糊", value: "0", note: "Sah di mode ini; dibayar nilai dasar 0 faan." },
      { name: "Common Hand", zh: "平糊", value: "1", note: "Semua set chow." },
      { name: "Self Pick / Concealed", zh: "自摸/門前清", value: "1", note: "Bonus kondisi." },
      { name: "Dragon / Wind Pung", zh: "三元/風牌", value: "1 / set", note: "Pola pertama yang mudah dibidik." },
      { name: "Seat Flower / No Flowers", zh: "正花/無花", value: "1", note: "Set 4 bunga/musim = 2 (menggantikan seat flower di set itu)." },
      { name: "All Pungs / Mixed One Suit", zh: "對對糊/混一色", value: "3", note: "Pola menengah." },
      { name: "Pola besar & limit", zh: "清一色 dll", value: "5–10", note: "Sama seperti HK Classic." },
    ],
    payout: ["Mengikuti tabel 半辣上 dan aturan bayar room, sama seperti HK Classic.", "Chicken Hand 0 faan tetap dibayar nilai dasar faan 0 (pengali venue)."],
    faq: [
      { q: "Kapan sebaiknya pindah dari Basic?", a: "Saat pemain sudah hafal alur ambil–buang dan bisa membidik 3 faan, pindah ke room HK Classic." },
      { q: "Apakah skor Basic masuk liga?", a: "Ya, tetapi liga bisa difilter per tipe permainan — skor Basic tidak tercampur dengan Classic/Taiwan bila kamu memakai filter." },
    ],
  },
};

export const GUIDE_ORDER: GameType[] = ["classic", "new18", "taiwan", "basic"];
