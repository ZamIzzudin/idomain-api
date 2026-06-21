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

const nonKlinisCategories = ["Non-Klinis", "Penelitian", "Pendidik/Pengajar"];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================
// RBAC seed: permissions, roles, and role<->permission mapping.
// Idempotent: safe to run multiple times. Only inserts missing
// rows; never deletes permissions/roles that were added via UI.
// ============================================================

type SeedPermission = {
  name: string;
  description: string;
  module: string;
};

const PERMISSION_CATALOGUE: SeedPermission[] = [
  // user
  { name: "user.view", description: "View user list", module: "user" },
  { name: "user.create", description: "Create new user", module: "user" },
  { name: "user.update", description: "Update user", module: "user" },
  { name: "user.delete", description: "Delete user", module: "user" },
  // role
  { name: "role.view", description: "View roles", module: "role" },
  { name: "role.create", description: "Create role", module: "role" },
  { name: "role.update", description: "Update role", module: "role" },
  { name: "role.delete", description: "Delete role", module: "role" },
  // alumni
  { name: "alumni.view", description: "View alumni", module: "alumni" },
  { name: "alumni.create", description: "Create alumni", module: "alumni" },
  { name: "alumni.update", description: "Update alumni", module: "alumni" },
  { name: "alumni.delete", description: "Delete alumni", module: "alumni" },
  { name: "alumni.approve", description: "Approve alumni registration", module: "alumni" },
  // article
  { name: "article.view", description: "View articles", module: "article" },
  { name: "article.create", description: "Create article", module: "article" },
  { name: "article.update", description: "Update article", module: "article" },
  { name: "article.delete", description: "Delete article", module: "article" },
  // event
  { name: "event.view", description: "View events", module: "event" },
  { name: "event.create", description: "Create event", module: "event" },
  { name: "event.update", description: "Update event", module: "event" },
  { name: "event.delete", description: "Delete event", module: "event" },
  // testimonial
  { name: "testimonial.view", description: "View testimonials", module: "testimonial" },
  { name: "testimonial.create", description: "Create testimonial", module: "testimonial" },
  { name: "testimonial.update", description: "Update testimonial", module: "testimonial" },
  { name: "testimonial.delete", description: "Delete testimonial", module: "testimonial" },
  // career
  { name: "career.view", description: "View careers", module: "career" },
  { name: "career.create", description: "Create career", module: "career" },
  { name: "career.update", description: "Update career", module: "career" },
  { name: "career.delete", description: "Delete career", module: "career" },
  { name: "career.approve", description: "Approve career listing", module: "career" },
  // category
  { name: "category.view", description: "View categories", module: "category" },
  { name: "category.create", description: "Create category", module: "category" },
  { name: "category.update", description: "Update category", module: "category" },
  { name: "category.delete", description: "Delete category", module: "category" },
  // setting
  { name: "setting.view", description: "View settings", module: "setting" },
  { name: "setting.update", description: "Update settings", module: "setting" },
];

// Admin (content-only) permission subset.
// NOTE: approve permissions (alumni.approve, career.approve) are intentionally
// excluded - superadmin must explicitly assign them to a designated role.
const ADMIN_PERMISSIONS = [
  "alumni.view", "alumni.create", "alumni.update", "alumni.delete",
  "article.view", "article.create", "article.update", "article.delete",
  "event.view", "event.create", "event.update", "event.delete",
  "testimonial.view", "testimonial.create", "testimonial.update", "testimonial.delete",
  "career.view", "career.create", "career.update", "career.delete",
  "category.view", "category.create", "category.update", "category.delete",
  "setting.view", "setting.update",
  "user.view", "role.view",
];

export const seedRbac = async () => {
  // 1. Permissions
  for (const p of PERMISSION_CATALOGUE) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }
  console.log(`Seeded ${PERMISSION_CATALOGUE.length} permissions.`);

  // 2. Roles (stable ids: Superadmin=1, Admin=2)
  const superadminRole = await prisma.role.upsert({
    where: { slug: "superadmin" },
    update: { name: "Superadmin", description: "Full system access", isSystem: true },
    create: {
      id: 1,
      name: "Superadmin",
      slug: "superadmin",
      description: "Full system access",
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { slug: "admin" },
    update: { name: "Admin", description: "Content management only" },
    create: {
      id: 2,
      name: "Admin",
      slug: "admin",
      description: "Content management only",
      isSystem: false,
    },
  });
  console.log("Seeded default roles (Superadmin, Admin).");

  // 3. Role <-> Permission mapping
  const allPermissions = await prisma.permission.findMany();
  const byName = new Map(allPermissions.map((p) => [p.name, p.id]));

  // Superadmin: every permission
  await prisma.rolePermission.deleteMany({ where: { roleId: superadminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: superadminRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // Admin: content subset only
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  const adminPermIds = ADMIN_PERMISSIONS
    .map((n) => byName.get(n))
    .filter((id): id is number => id !== undefined);
  await prisma.rolePermission.createMany({
    data: adminPermIds.map((pid) => ({ roleId: adminRole.id, permissionId: pid })),
    skipDuplicates: true,
  });
  console.log("Seeded role <-> permission mapping.");

  return { superadminRoleId: superadminRole.id, adminRoleId: adminRole.id };
};

export const seedGenesisAccount = async () => {
  const existing = await prisma.user.findFirst();

  if (existing) {
    console.log("Genesis account already exists, skipping seed.");
    return;
  }

  // Make sure RBAC (and Superadmin role) exists before creating user
  const { superadminRoleId } = await seedRbac();

  const passwordHash = await bcrypt.hash(config.seedGenesisPassword, 10);

  await prisma.user.create({
    data: {
      username: config.seedGenesisUsername,
      displayName: config.seedGenesisDisplayName,
      password: passwordHash,
      roleId: superadminRoleId,
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
    { key: "site_name", value: "iDomain", category: "general" },
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
    `Seeded ${klinisData.length + nonKlinisData.length} career categories.`,
  );
};

export const runSeed = async () => {
  await prisma.$connect();
  await seedRbac();
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
