import { articleRepository } from "./article.repository";
import { deleteFromCloudinary } from "../../lib/cloudinary";
import type {
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleQueryRequest,
} from "./article.schema";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function ensureUniqueSlug(slug: string, excludeId?: number): Promise<string> {
  const existing = await articleRepository.findBySlug(slug);
  if (!existing || existing.id === excludeId) return slug;

  let counter = 1;
  let newSlug = `${slug}-${counter}`;
  while (true) {
    const dup = await articleRepository.findBySlug(newSlug);
    if (!dup || dup.id === excludeId) return newSlug;
    counter++;
    newSlug = `${slug}-${counter}`;
  }
}

export const articleService = {
  list: (query: ArticleQueryRequest) => articleRepository.findPaginated(query),

  getBySlug: async (slug: string) => {
    const article = await articleRepository.findBySlug(slug);
    if (article && article.status === "PUBLISHED") {
      await articleRepository.incrementViews(article.id);
    }
    return article;
  },

  getById: (id: number) => articleRepository.findById(id),

  create: async (data: CreateArticleRequest) => {
    const slug = data.slug
      ? await ensureUniqueSlug(generateSlug(data.slug))
      : await ensureUniqueSlug(generateSlug(data.title));

    let publishedAt: Date | null = null;
    if (data.publishedAt) {
      publishedAt = new Date(data.publishedAt);
    } else if (data.status === "PUBLISHED") {
      publishedAt = new Date();
    }

    return articleRepository.create({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      author: data.author,
      tags: data.tags,
      featuredImage: (data as any).featuredImage,
      featuredImagePublicId: (data as any).featuredImagePublicId,
      status: data.status as any,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: data.metaKeywords,
      publishedAt,
    });
  },

  update: async (id: number, data: UpdateArticleRequest) => {
    const existing = await articleRepository.findById(id);
    if (!existing) throw new Error("Article not found");

    // If featured image is being changed, cleanup old from CDN
    if (data.featuredImage !== undefined && existing.featuredImagePublicId) {
      if (data.featuredImage !== existing.featuredImage) {
        await deleteFromCloudinary(existing.featuredImagePublicId);
      }
    }

    const updateData: any = { ...data };

    // Handle slug update
    if (data.slug !== undefined) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.slug), id);
    } else if (data.title && data.title !== existing.title) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.title), id);
    }

    // Handle publishedAt
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    } else if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    return articleRepository.update(id, updateData);
  },

  remove: async (id: number) => {
    const existing = await articleRepository.findById(id);
    if (!existing) throw new Error("Article not found");

    if (existing.featuredImagePublicId) {
      await deleteFromCloudinary(existing.featuredImagePublicId);
    }

    return articleRepository.remove(id);
  },

  filterOptions: () =>
    articleRepository.findDistinctTags().then((tags) => ({ tags })),
};
