import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma";
import { config } from "./config";

const klinisCategories = [
  "Umum",
  "Anak",
  "Anestesiologi",
  "Bedah Umum",
  "Bedah Saraf",
  "Bedah Orthopedi",
  "Bedah Plastik",
  "Bedah Toraks dan Kardiovaskular",
  "Bedah Urologi",
  "Bedah Vaskular",
  "Dermatologi dan Venereologi",
  "Forensik",
  "Gigi dan Mulut",
  "Jantung dan Pembuluh Darah",
  "Kedokteran Fisik dan Rehabilitasi",
  "Kedokteran Jiwa",
  "Kedokteran Okupasi",
  "Kedokteran Olahraga",
  "Kulit dan Kelamin",
  "Mata",
  "Neurologi",
  "Obstetri dan Ginekologi",
  "Onkologi Radiasi",
  "Orthopedi",
  "Otorhinolaringologi",
  "Patologi Anatomi",
  "Patologi Klinik",
  "Pediatri",
  "Penyakit Dalam",
  "Radiologi",
  "Reproduksi Manusia",
  "Spesialis Bedah Syaraf",
  "Spesialis Gastroenterologi",
  "Spesialis Hematologi",
  "Spesialis Nefrologi",
  "Spesialis Paru",
  "Spesialis Rheumatologi",
  "THT-KL",
  "Akupuntur",
  "Alergi dan Imunologi",
  "Andrologi",
  "Bedah Digestif",
  "Bedah Onkologi",
  "Bedah Plastik Rekonstruksi",
  "Bedah Rekonstruksi dan Estetik",
  "Endokrinologi",
  "Endodonti",
  "Farmakologi Klinik",
  "Gastroenterologi Hepatologi",
  "Geriatri",
  "Hematologi Onkologi",
  "Infeksi",
  "Kedokteran Aerospace",
  "Kedokteran Gigi Anak",
  "Kedokteran Gigi Pencegahan",
  "Kedokteran Kelautan",
  "Kedokteran Penerbangan",
  "Mikrobiologi Klinik",
  "Nefrologi Anak",
  "Neurologi Anak",
  "Onkologi Anak",
  "Onkologi Medik",
  "Ortodonti",
  "Periodonti",
  "Prosthodonti",
  "Pulmonologi",
  "Radioterapi",
  "Rehabilitasi Medik",
  "Tumbuh Kembang",
];

const nonKlinisCategories = [
  "Non-Klinis",
  "Penelitian",
  "Pendidik/Pengajar",
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const seedGenesisAccount = async () => {
  const existing = await prisma.user.findFirst();

  if (existing) {
    console.log("Genesis account already exists, skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(config.seedGenesisPassword, 10);

  await prisma.user.create({
    data: {
      username: config.seedGenesisUsername,
      displayName: config.seedGenesisDisplayName,
      password: passwordHash,
      role: "SUPERADMIN",
      status: 1,
    },
  });

  console.log(`Genesis account created: ${config.seedGenesisUsername}`);
};

export const seedSiteSettings = async () => {
  // Remove old hero keys that are no longer used
  const oldHeroKeys = [
    "hero_title",
    "hero_subtitle",
    "hero_cta_primary_text",
    "hero_cta_primary_url",
    "hero_cta_secondary_text",
    "hero_cta_secondary_url",
  ];

  for (const key of oldHeroKeys) {
    await prisma.siteSetting.deleteMany({ where: { key } });
  }
  console.log("Cleaned up old hero settings.");

  // Ensure hero_banners key exists
  const existing = await prisma.siteSetting.findUnique({
    where: { key: "hero_banners" },
  });

  if (!existing) {
    await prisma.siteSetting.create({
      data: {
        key: "hero_banners",
        value: null,
        category: "hero",
      },
    });
    console.log("Created hero_banners setting.");
  }

  // Seed default settings if they don't exist
  const defaults = [
    { key: "site_name", value: "IDOMAIN", category: "general" },
    {
      key: "site_description",
      value: "Ikatan Dokter Muslim Alumni UIN",
      category: "general",
    },
    { key: "site_logo", value: null, category: "general" },
    { key: "site_favicon", value: null, category: "general" },
    { key: "about_title", value: "Tentang Kami", category: "about" },
    { key: "about_description", value: null, category: "about" },
    { key: "about_visi", value: null, category: "about" },
    { key: "about_misi", value: null, category: "about" },
    { key: "about_image", value: null, category: "about" },
    { key: "about_gallery", value: null, category: "about" },
    { key: "home_about_title", value: null, category: "home_about" },
    { key: "home_about_description", value: null, category: "home_about" },
    { key: "home_about_image", value: null, category: "home_about" },
    { key: "contact_email", value: null, category: "contact" },
    { key: "contact_phone", value: null, category: "contact" },
    { key: "contact_address", value: null, category: "contact" },
    { key: "social_facebook", value: null, category: "social" },
    { key: "social_instagram", value: null, category: "social" },
    { key: "social_youtube", value: null, category: "social" },
    { key: "social_linkedin", value: null, category: "social" },
    { key: "social_twitter", value: null, category: "social" },
    { key: "social_links", value: null, category: "social" },
    { key: "cta_title", value: null, category: "cta" },
    { key: "cta_description", value: null, category: "cta" },
    { key: "cta_button_text", value: null, category: "cta" },
    { key: "cta_button_url", value: null, category: "cta" },
  ];

  for (const s of defaults) {
    const existingSetting = await prisma.siteSetting.findUnique({
      where: { key: s.key },
    });
    if (!existingSetting) {
      await prisma.siteSetting.create({ data: s });
    }
  }
  console.log("Site settings seeded.");
};

export const seedCareerCategories = async () => {
  const existing = await prisma.careerCategory.count();
  if (existing > 0) {
    console.log("Career categories already exist, skipping seed.");
    return;
  }

  const klinisData = klinisCategories.map((name, index) => ({
    name,
    slug: toSlug(name),
    type: "KLINIS" as const,
    sortOrder: index,
  }));

  const nonKlinisData = nonKlinisCategories.map((name, index) => ({
    name,
    slug: toSlug(name),
    type: "NON_KLINIS" as const,
    sortOrder: index,
  }));

  await prisma.careerCategory.createMany({
    data: [...klinisData, ...nonKlinisData],
  });

  console.log(
    `Seeded ${klinisData.length + nonKlinisData.length} career categories.`
  );
};

export const runSeed = async () => {
  await prisma.$connect();
  await seedGenesisAccount();
  await seedSiteSettings();
  await seedCareerCategories();
  await prisma.$disconnect();
};

if (require.main === module) {
  runSeed().catch(async (error) => {
    console.error("Prisma seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
