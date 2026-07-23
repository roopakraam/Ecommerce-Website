import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import { Client } from "pg";

const connectionString =
  "postgres://postgres:BookMyTees%40123@db.lqjkeiaaqpejsfvcxcxc.supabase.co:5432/postgres";

interface VariantSeed {
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceOverride?: number;
}

interface ReviewSeed {
  reviewerName: string;
  rating: number;
  title: string;
  body: string;
}

interface ProductSeed {
  name: string;
  slug: string;
  categorySlug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  variants: VariantSeed[];
  reviews?: ReviewSeed[];
}

const productsToSeed: ProductSeed[] = [
  // --- Category 1: Graphic Tees ---
  {
    name: "Cyberpunk Neon Samurai",
    slug: "cyberpunk-neon-samurai",
    categorySlug: "graphic-tees",
    description:
      "Futuristic neon Japanese print on heavy 240 GSM bio-washed cotton. Features dynamic drop-shoulder fit, high-density screenprint on the back, and ribbed collar that stays tight after multiple washes.",
    price: 899,
    compareAtPrice: 1499,
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Pitch Black", sku: "BM-CYBER-BLK-S", stock: 15 },
      { size: "M", color: "Pitch Black", sku: "BM-CYBER-BLK-M", stock: 25 },
      { size: "L", color: "Pitch Black", sku: "BM-CYBER-BLK-L", stock: 30 },
      { size: "XL", color: "Pitch Black", sku: "BM-CYBER-BLK-XL", stock: 18 },
      { size: "XXL", color: "Pitch Black", sku: "BM-CYBER-BLK-XXL", stock: 8 },
      { size: "M", color: "Acid Grey", sku: "BM-CYBER-GRY-M", stock: 12 },
      { size: "L", color: "Acid Grey", sku: "BM-CYBER-GRY-L", stock: 15 },
    ],
    reviews: [
      {
        reviewerName: "Aarav S.",
        rating: 5,
        title: "Mindblowing print quality!",
        body: "The 240 GSM fabric feels solid and heavy. The neon graphics pop like crazy under light. Easily my favorite graphic tee now.",
      },
      {
        reviewerName: "Rohan M.",
        rating: 5,
        title: "Perfect boxy fit",
        body: "Bought an L and the drop shoulders give that perfect relaxed streetwear silhouette. Washing instructions work great, zero shrinking.",
      },
    ],
  },
  {
    name: "Retro Arcade Glitch Tee",
    slug: "retro-arcade-glitch-tee",
    categorySlug: "graphic-tees",
    description:
      "Nostalgic 80s vaporwave arcade graphic print. Crafted from 220 GSM 100% combed ringspun cotton with soft hand-feel screen printing for maximum comfort.",
    price: 799,
    compareAtPrice: 1199,
    images: [
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Pitch Black", sku: "BM-ARCADE-BLK-S", stock: 10 },
      { size: "M", color: "Pitch Black", sku: "BM-ARCADE-BLK-M", stock: 20 },
      { size: "L", color: "Pitch Black", sku: "BM-ARCADE-BLK-L", stock: 22 },
      { size: "XL", color: "Pitch Black", sku: "BM-ARCADE-BLK-XL", stock: 14 },
      { size: "M", color: "Vintage White", sku: "BM-ARCADE-WHT-M", stock: 10 },
      { size: "L", color: "Vintage White", sku: "BM-ARCADE-WHT-L", stock: 15 },
    ],
    reviews: [
      {
        reviewerName: "Devansh P.",
        rating: 4,
        title: "Awesome retro vibes",
        body: "The colors look vibrant and nostalgic. Soft fabric that feels great for everyday wear.",
      },
    ],
  },
  {
    name: "Midnight Astral Dragon",
    slug: "midnight-astral-dragon",
    categorySlug: "graphic-tees",
    description:
      "Intricate metallic puff print cosmic dragon graphic on dark charcoal canvas. Premium oversized streetwear silhouette engineered for maximum durability.",
    price: 949,
    compareAtPrice: 1599,
    images: [
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Dark Charcoal", sku: "BM-DRAGON-CHR-S", stock: 12 },
      { size: "M", color: "Dark Charcoal", sku: "BM-DRAGON-CHR-M", stock: 18 },
      { size: "L", color: "Dark Charcoal", sku: "BM-DRAGON-CHR-L", stock: 25 },
      { size: "XL", color: "Dark Charcoal", sku: "BM-DRAGON-CHR-XL", stock: 20 },
      { size: "XXL", color: "Dark Charcoal", sku: "BM-DRAGON-CHR-XXL", stock: 10 },
    ],
    reviews: [
      {
        reviewerName: "Vikram K.",
        rating: 5,
        title: "The dragon print details are insane",
        body: "Puff printing gives a 3D texture to the dragon wings. Super high quality production!",
      },
    ],
  },

  // --- Category 2: Oversized Tees ---
  {
    name: "Heavyweight Boxy Raw Tee",
    slug: "heavyweight-boxy-raw-tee",
    categorySlug: "oversized-tees",
    description:
      "Ultra-heavy 280 GSM French terry cotton with relaxed drop shoulders, structured boxy collar, and raw raw-edge hem finish. Built to drape structured and heavy.",
    price: 999,
    compareAtPrice: 1699,
    images: [
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Washed Black", sku: "BM-RAW-WBLK-S", stock: 15 },
      { size: "M", color: "Washed Black", sku: "BM-RAW-WBLK-M", stock: 28 },
      { size: "L", color: "Washed Black", sku: "BM-RAW-WBLK-L", stock: 35 },
      { size: "XL", color: "Washed Black", sku: "BM-RAW-WBLK-XL", stock: 20 },
      { size: "M", color: "Sand Beige", sku: "BM-RAW-BGE-M", stock: 16 },
      { size: "L", color: "Sand Beige", sku: "BM-RAW-BGE-L", stock: 22 },
    ],
    reviews: [
      {
        reviewerName: "Karan G.",
        rating: 5,
        title: "Best oversized fit in India",
        body: "280 GSM is heavy and premium. Doesn't cling to the body and holds that boxy shape flawlessly. 10/10 recommendation.",
      },
    ],
  },
  {
    name: "Aesthetic Acid-Wash Drop Tee",
    slug: "aesthetic-acid-wash-drop-tee",
    categorySlug: "oversized-tees",
    description:
      "Hand-dyed vintage acid wash tee. Each piece features a unique marbled pattern, double-stitched drop shoulder seams, and pre-shrunk 240 GSM organic cotton.",
    price: 899,
    compareAtPrice: 1399,
    images: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Acid Black", sku: "BM-ACID-BLK-S", stock: 14 },
      { size: "M", color: "Acid Black", sku: "BM-ACID-BLK-M", stock: 24 },
      { size: "L", color: "Acid Black", sku: "BM-ACID-BLK-L", stock: 28 },
      { size: "XL", color: "Acid Black", sku: "BM-ACID-BLK-XL", stock: 16 },
      { size: "M", color: "Slate Grey", sku: "BM-ACID-SLT-M", stock: 10 },
      { size: "L", color: "Slate Grey", sku: "BM-ACID-SLT-L", stock: 18 },
    ],
    reviews: [
      {
        reviewerName: "Sameer N.",
        rating: 5,
        title: "Unique vintage wash",
        body: "Looks like a high-end designer tee. The acid wash effect gives a really cool vintage patina.",
      },
    ],
  },
  {
    name: "Urban Essential Oversized Crew",
    slug: "urban-essential-oversized-crew",
    categorySlug: "oversized-tees",
    description:
      "The signature everyday boxy fit tee. Built with thick 1.2-inch ribbed crew neck, subtle side splits, and minimal silicone chest patch branding.",
    price: 849,
    compareAtPrice: 1299,
    images: [
      "https://images.unsplash.com/photo-1622445268465-840246e904fb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Off-White", sku: "BM-URBAN-WHT-S", stock: 18 },
      { size: "M", color: "Off-White", sku: "BM-URBAN-WHT-M", stock: 30 },
      { size: "L", color: "Off-White", sku: "BM-URBAN-WHT-L", stock: 35 },
      { size: "XL", color: "Off-White", sku: "BM-URBAN-WHT-XL", stock: 22 },
      { size: "M", color: "Forest Green", sku: "BM-URBAN-GRN-M", stock: 14 },
      { size: "L", color: "Forest Green", sku: "BM-URBAN-GRN-L", stock: 20 },
    ],
    reviews: [
      {
        reviewerName: "Nikhil T.",
        rating: 5,
        title: "Clean minimalist aesthetic",
        body: "The thick ribbed neckline doesn't stretch out after washing. Great essential tee.",
      },
    ],
  },

  // --- Category 3: Minimalist ---
  {
    name: "Monochrome Signature Tee",
    slug: "monochrome-signature-tee",
    categorySlug: "minimalist",
    description:
      "Clean, understated luxury. Micro-embroidered chest logo on ultra-soft 200 GSM organic ringspun cotton with clean-cut tailored sleeves.",
    price: 699,
    compareAtPrice: 999,
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Pure White", sku: "BM-MONO-WHT-S", stock: 20 },
      { size: "M", color: "Pure White", sku: "BM-MONO-WHT-M", stock: 35 },
      { size: "L", color: "Pure White", sku: "BM-MONO-WHT-L", stock: 40 },
      { size: "XL", color: "Pure White", sku: "BM-MONO-WHT-XL", stock: 25 },
      { size: "S", color: "Jet Black", sku: "BM-MONO-BLK-S", stock: 18 },
      { size: "M", color: "Jet Black", sku: "BM-MONO-BLK-M", stock: 32 },
      { size: "L", color: "Jet Black", sku: "BM-MONO-BLK-L", stock: 38 },
    ],
    reviews: [
      {
        reviewerName: "Priyansh V.",
        rating: 5,
        title: "Ultra clean white tee",
        body: "Not see-through at all. Perfect thickness and super soft against the skin.",
      },
    ],
  },
  {
    name: "Tokyo Coordinates Essential Tee",
    slug: "tokyo-coordinates-essential-tee",
    categorySlug: "minimalist",
    description:
      "Subtle typography showing Tokyo district coordinates across the side seam. Minimalist typography design engineered for sleek everyday pairing.",
    price: 749,
    compareAtPrice: 1099,
    images: [
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Concrete Grey", sku: "BM-TOKYO-GRY-S", stock: 12 },
      { size: "M", color: "Concrete Grey", sku: "BM-TOKYO-GRY-M", stock: 22 },
      { size: "L", color: "Concrete Grey", sku: "BM-TOKYO-GRY-L", stock: 26 },
      { size: "XL", color: "Concrete Grey", sku: "BM-TOKYO-GRY-XL", stock: 15 },
      { size: "M", color: "Sage Green", sku: "BM-TOKYO-SGE-M", stock: 14 },
      { size: "L", color: "Sage Green", sku: "BM-TOKYO-SGE-L", stock: 18 },
    ],
    reviews: [
      {
        reviewerName: "Aditya R.",
        rating: 4,
        title: "Subtle and stylish",
        body: "Love the quiet branding on the side. Fits true to size.",
      },
    ],
  },
  {
    name: "Quiet Luxury Heavyweight Tee",
    slug: "quiet-luxury-heavyweight-tee",
    categorySlug: "minimalist",
    description:
      "Zero loud branding, 100% top-grain Pima cotton. Perfect structured drape that holds form wash after wash without piling or fading.",
    price: 899,
    compareAtPrice: 1299,
    images: [
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Warm Taupe", sku: "BM-QLUX-TPE-S", stock: 15 },
      { size: "M", color: "Warm Taupe", sku: "BM-QLUX-TPE-M", stock: 25 },
      { size: "L", color: "Warm Taupe", sku: "BM-QLUX-TPE-L", stock: 30 },
      { size: "XL", color: "Warm Taupe", sku: "BM-QLUX-TPE-XL", stock: 18 },
      { size: "M", color: "Dark Olive", sku: "BM-QLUX-OLV-M", stock: 16 },
      { size: "L", color: "Dark Olive", sku: "BM-QLUX-OLV-L", stock: 20 },
    ],
    reviews: [
      {
        reviewerName: "Tushar B.",
        rating: 5,
        title: "Worth every rupee",
        body: "The Pima cotton fabric quality is top tier. Feels like a Rs. 4000 imported shirt.",
      },
    ],
  },

  // --- Category 4: Hoodies & Sweatshirts ---
  {
    name: "Nightfall Heavyweight Pullover Hoodie",
    slug: "nightfall-heavyweight-pullover-hoodie",
    categorySlug: "hoodies-sweatshirts",
    description:
      "Plush 400 GSM double-fleece cotton hoodie with high-density double-lined hood, seamless kangaroo pocket, and heavy metal-tipped drawstrings.",
    price: 1999,
    compareAtPrice: 2999,
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Stealth Black", sku: "BM-HOOD-BLK-S", stock: 10 },
      { size: "M", color: "Stealth Black", sku: "BM-HOOD-BLK-M", stock: 20 },
      { size: "L", color: "Stealth Black", sku: "BM-HOOD-BLK-L", stock: 25 },
      { size: "XL", color: "Stealth Black", sku: "BM-HOOD-BLK-XL", stock: 15 },
      { size: "M", color: "Washed Charcoal", sku: "BM-HOOD-CHR-M", stock: 12 },
      { size: "L", color: "Washed Charcoal", sku: "BM-HOOD-CHR-L", stock: 18 },
    ],
    reviews: [
      {
        reviewerName: "Karthik N.",
        rating: 5,
        title: "Super cozy and heavy!",
        body: "400 GSM keeps you warm and looks incredible. The double-lined hood holds structure without sagging.",
      },
    ],
  },
  {
    name: "Cyber Graphic Oversized Hoodie",
    slug: "cyber-graphic-oversized-hoodie",
    categorySlug: "hoodies-sweatshirts",
    description:
      "Bold futuristic back print with reflective text accents on 380 GSM French terry fleece. Features drop shoulders and deep ribbed storm cuffs.",
    price: 2199,
    compareAtPrice: 3299,
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "M", color: "Jet Black", sku: "BM-CYHOOD-BLK-M", stock: 15 },
      { size: "L", color: "Jet Black", sku: "BM-CYHOOD-BLK-L", stock: 20 },
      { size: "XL", color: "Jet Black", sku: "BM-CYHOOD-BLK-XL", stock: 12 },
      { size: "L", color: "Electric Violet", sku: "BM-CYHOOD-VLT-L", stock: 8 },
    ],
    reviews: [
      {
        reviewerName: "Yash W.",
        rating: 5,
        title: "Reflective graphic looks wild at night",
        body: "High quality print and fleece lining inside is super comfortable.",
      },
    ],
  },
  {
    name: "Vintage Washed Crewneck Sweatshirt",
    slug: "vintage-washed-crewneck-sweatshirt",
    categorySlug: "hoodies-sweatshirts",
    description:
      "Pigment-dyed 350 GSM crewneck sweatshirt with ribbed side panels, cuffs, and collar. Effortless streetwear layering piece.",
    price: 1799,
    compareAtPrice: 2499,
    images: [
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Faded Olive", sku: "BM-CREW-OLV-S", stock: 8 },
      { size: "M", color: "Faded Olive", sku: "BM-CREW-OLV-M", stock: 16 },
      { size: "L", color: "Faded Olive", sku: "BM-CREW-OLV-L", stock: 22 },
      { size: "XL", color: "Faded Olive", sku: "BM-CREW-OLV-XL", stock: 10 },
      { size: "M", color: "Oat Beige", sku: "BM-CREW-BGE-M", stock: 12 },
      { size: "L", color: "Oat Beige", sku: "BM-CREW-BGE-L", stock: 15 },
    ],
    reviews: [
      {
        reviewerName: "Rahul D.",
        rating: 5,
        title: "Great vintage washed look",
        body: "Fits perfect over a plain white tee. Material is sturdy yet soft.",
      },
    ],
  },

  // --- Category 5: Anime & Pop Culture ---
  {
    name: "Demon Hunter Flame Oversized Tee",
    slug: "demon-hunter-flame-oversized-tee",
    categorySlug: "anime-pop-culture",
    description:
      "High-definition manga panel back print with Japanese calligraphy on 240 GSM heavy combed cotton. Vibrant flame gradients with soft screenprint feel.",
    price: 949,
    compareAtPrice: 1499,
    images: [
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Pitch Black", sku: "BM-DEMON-BLK-S", stock: 14 },
      { size: "M", color: "Pitch Black", sku: "BM-DEMON-BLK-M", stock: 26 },
      { size: "L", color: "Pitch Black", sku: "BM-DEMON-BLK-L", stock: 32 },
      { size: "XL", color: "Pitch Black", sku: "BM-DEMON-BLK-XL", stock: 18 },
      { size: "XXL", color: "Pitch Black", sku: "BM-DEMON-BLK-XXL", stock: 10 },
    ],
    reviews: [
      {
        reviewerName: "Kabir M.",
        rating: 5,
        title: "Must have for anime fans!",
        body: "The manga panel details are crystal clear. Great quality oversized shirt.",
      },
    ],
  },
  {
    name: "Neon Genesis Mech Oversized Tee",
    slug: "neon-genesis-mech-oversized-tee",
    categorySlug: "anime-pop-culture",
    description:
      "Retro 90s mecha anime schematic print with glowing neon accents. Heavyweight drop-shoulder cut crafted for durability.",
    price: 899,
    compareAtPrice: 1399,
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Midnight Blue", sku: "BM-MECH-BLU-S", stock: 10 },
      { size: "M", color: "Midnight Blue", sku: "BM-MECH-BLU-M", stock: 20 },
      { size: "L", color: "Midnight Blue", sku: "BM-MECH-BLU-L", stock: 25 },
      { size: "XL", color: "Midnight Blue", sku: "BM-MECH-BLU-XL", stock: 14 },
    ],
    reviews: [
      {
        reviewerName: "Dhruv H.",
        rating: 5,
        title: "Retro cyber aesthetic is top notch",
        body: "Fast delivery, incredible packaging, and tee quality is outstanding.",
      },
    ],
  },
  {
    name: "Shinobi Clan Graphic Tee",
    slug: "shinobi-clan-graphic-tee",
    categorySlug: "anime-pop-culture",
    description:
      "Minimalist front clan chest emblem with full-back ink wash style shinobi illustration. 220 GSM breathable combed cotton.",
    price: 849,
    compareAtPrice: 1299,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [
      { size: "S", color: "Pitch Black", sku: "BM-SHINOBI-BLK-S", stock: 12 },
      { size: "M", color: "Pitch Black", sku: "BM-SHINOBI-BLK-M", stock: 24 },
      { size: "L", color: "Pitch Black", sku: "BM-SHINOBI-BLK-L", stock: 28 },
      { size: "XL", color: "Pitch Black", sku: "BM-SHINOBI-BLK-XL", stock: 16 },
      { size: "M", color: "Chalk White", sku: "BM-SHINOBI-WHT-M", stock: 10 },
      { size: "L", color: "Chalk White", sku: "BM-SHINOBI-WHT-L", stock: 14 },
    ],
    reviews: [
      {
        reviewerName: "Ishan S.",
        rating: 5,
        title: "Art on the back is sick",
        body: "Ink brush art print feels smooth and doesn't crack.",
      },
    ],
  },
];

async function runSeed() {
  const client = new Client({
    host: "13.234.182.164",
    port: 5432,
    user: "postgres.lqjkeiaaqpejsfvcxcxc",
    password: "BookMyTees@123",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected directly to Supabase Postgres database.");

  try {
    // 1. Fetch categories
    const catRes = await client.query("SELECT id, slug FROM public.categories;");
    const categoryMap = new Map<string, string>();
    catRes.rows.forEach((row) => categoryMap.set(row.slug, row.id));

    console.log("Database Categories:", Array.from(categoryMap.entries()));

    for (const prod of productsToSeed) {
      const categoryId = categoryMap.get(prod.categorySlug);
      if (!categoryId) {
        console.warn(`Category '${prod.categorySlug}' not found! Skipping '${prod.name}'.`);
        continue;
      }

      console.log(`Processing product: "${prod.name}"...`);

      // Check if product exists
      const existing = await client.query(
        "SELECT id FROM public.products WHERE slug = $1 LIMIT 1;",
        [prod.slug]
      );

      let productId: string;

      if (existing.rows.length > 0) {
        productId = existing.rows[0].id;
        await client.query(
          `UPDATE public.products 
           SET name = $1, description = $2, price = $3, compare_at_price = $4, category_id = $5, is_active = true, updated_at = now()
           WHERE id = $6;`,
          [prod.name, prod.description, prod.price, prod.compareAtPrice || null, categoryId, productId]
        );

        // Delete existing images, variants, and reviews to refresh cleanly
        await client.query("DELETE FROM public.product_images WHERE product_id = $1;", [productId]);
        await client.query("DELETE FROM public.product_variants WHERE product_id = $1;", [productId]);
        await client.query("DELETE FROM public.product_reviews WHERE product_id = $1;", [productId]);
      } else {
        const insertRes = await client.query(
          `INSERT INTO public.products (name, slug, description, price, compare_at_price, category_id, stock_quantity, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, 0, true)
           RETURNING id;`,
          [prod.name, prod.slug, prod.description, prod.price, prod.compareAtPrice || null, categoryId]
        );
        productId = insertRes.rows[0].id;
      }

      // Insert images
      for (let i = 0; i < prod.images.length; i++) {
        await client.query(
          `INSERT INTO public.product_images (product_id, url, position)
           VALUES ($1, $2, $3);`,
          [productId, prod.images[i], i]
        );
      }

      // Insert variants
      for (const v of prod.variants) {
        await client.query(
          `INSERT INTO public.product_variants (product_id, size, color, sku, stock_quantity, price_override, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true);`,
          [productId, v.size, v.color, v.sku, v.stock, v.priceOverride || null]
        );
      }

      // Insert reviews
      if (prod.reviews && prod.reviews.length > 0) {
        for (const r of prod.reviews) {
          await client.query(
            `INSERT INTO public.product_reviews (product_id, rating, title, body, status, reviewer_name, moderated_at)
             VALUES ($1, $2, $3, $4, 'approved', $5, now());`,
            [productId, r.rating, r.title, r.body, r.reviewerName]
          );
        }
      }

      console.log(`✅ Successfully seeded "${prod.name}" (${prod.variants.length} variants, ${prod.images.length} images)`);
    }

    // Verify product counts
    const finalCount = await client.query("SELECT COUNT(*) FROM public.products;");
    const variantCount = await client.query("SELECT COUNT(*) FROM public.product_variants;");
    const imageCount = await client.query("SELECT COUNT(*) FROM public.product_images;");
    const reviewCount = await client.query("SELECT COUNT(*) FROM public.product_reviews;");

    console.log("\n--- SEEDING SUMMARY ---");
    console.log(`Total Products: ${finalCount.rows[0].count}`);
    console.log(`Total Product Variants: ${variantCount.rows[0].count}`);
    console.log(`Total Product Images: ${imageCount.rows[0].count}`);
    console.log(`Total Product Reviews: ${reviewCount.rows[0].count}`);
    console.log("------------------------");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await client.end();
  }
}

runSeed();
