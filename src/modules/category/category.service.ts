import { categoryRepository } from "./category.repository";
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryQueryRequest,
} from "./category.schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const categoryService = {
  list: (query: CategoryQueryRequest) =>
    categoryRepository.findAll({
      type: query.type,
      sortOrder: query.sortOrder,
    }),

  create: async (data: CreateCategoryRequest) => {
    const slug = data.slug || generateSlug(data.name);

    const existingName = await categoryRepository.findByName(data.name);
    if (existingName) throw new Error("Category name already exists");

    const existingSlug = await categoryRepository.findBySlug(slug);
    if (existingSlug) throw new Error("Category slug already exists");

    return categoryRepository.create({
      name: data.name,
      slug,
      type: data.type,
      sortOrder: data.sortOrder,
    });
  },

  update: async (id: number, data: UpdateCategoryRequest) => {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new Error("Category not found");

    const updateData: any = { ...data };

    if (data.slug !== undefined) {
      updateData.slug = generateSlug(data.slug);
    } else if (data.name && data.name !== existing.name) {
      updateData.slug = generateSlug(data.name);
    }

    return categoryRepository.update(id, updateData);
  },

  remove: async (id: number) => {
    const careerCount = await categoryRepository.countCareers(id);
    if (careerCount > 0) {
      throw new Error(
        `Cannot delete category with ${careerCount} career(s) attached`
      );
    }

    return categoryRepository.remove(id);
  },
};
