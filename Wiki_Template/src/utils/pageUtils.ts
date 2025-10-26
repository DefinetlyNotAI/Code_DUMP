import { WikiPage, WikiCategory } from '../types/WikiTypes';

// Use Vite's import.meta.glob to eagerly load all wiki pages
const pages = import.meta.glob('../pages/**/*.tsx', { eager: true }) as Record<string, { default: WikiPage }>;

// Convert filename to slug (e.g., '../pages/items/sword.tsx' -> 'sword')
const fileToSlug = (filepath: string): string => {
  const match = filepath.match(/\/([^/]+)\.tsx$/);
  return match ? match[1] : '';
};

// Get category from file path
const getCategory = (filepath: string): WikiCategory | null => {
  const match = filepath.match(/\/pages\/([^/]+)\//);
  return match ? match[1] as WikiCategory : null;
};

// Create maps for both canonical and filename-based slugs
const pagesByCanonicalSlug: Record<string, { page: WikiPage; category: string }> = {};
const pagesByFilenameSlug: Record<string, { page: WikiPage; category: string }> = {};

// Initialize the page maps
Object.entries(pages).forEach(([filepath, module]) => {
  const category = getCategory(filepath);
  if (!category || !module.default) return;

  const page = module.default;
  const filenameSlug = fileToSlug(filepath);
  
  // Create canonical slug from title (if available)
  const canonicalSlug = page.title
    ? page.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    : filenameSlug;

  // Store page under both slugs
  pagesByCanonicalSlug[`${category}/${canonicalSlug}`] = { page, category };
  pagesByFilenameSlug[`${category}/${filenameSlug}`] = { page, category };
});

/**
 * Get all available page paths organized by category
 */
export const getPagePaths = async (): Promise<Record<string, string[]>> => {
  const paths: Record<string, string[]> = {};
  
  Object.entries(pagesByFilenameSlug).forEach(([key, { category }]) => {
    const slug = key.split('/')[1];
    if (!paths[category]) {
      paths[category] = [];
    }
    paths[category].push(slug);
  });
  
  return paths;
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<WikiCategory[]> => {
  const paths = await getPagePaths();
  return Object.keys(paths) as WikiCategory[];
};

/**
 * Load a specific page by category and slug
 */
export const loadPage = async (
  category: WikiCategory,
  slug: string
): Promise<WikiPage | null> => {
  try {
    const fullPath = `${category}/${slug}`;
    
    // Try canonical slug first
    const canonicalMatch = pagesByCanonicalSlug[fullPath];
    if (canonicalMatch) {
      return canonicalMatch.page;
    }
    
    // Try filename-based slug as fallback
    const filenameMatch = pagesByFilenameSlug[fullPath];
    if (filenameMatch) {
      return filenameMatch.page;
    }
    
    console.warn(`No matching page found for ${fullPath}`);
    return null;
  } catch (error) {
    console.error(`Failed to load page: ${category}/${slug}`, error);
    return null;
  }
};

/**
 * Get all pages in a category
 */
export const getCategoryPages = async (
  category: WikiCategory
): Promise<WikiPage[]> => {
  const paths = await getPagePaths();
  const categoryPaths = paths[category] || [];
  
  const loadedPages: WikiPage[] = [];
  
  for (const slug of categoryPaths) {
    const page = await loadPage(category, slug);
    if (page) {
      loadedPages.push(page);
    }
  }
  
  // Sort pages by order, then by title
  return loadedPages.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return a.title.localeCompare(b.title);
  });
};

/**
 * Get all pages across all categories
 */
export const getAllPages = async (): Promise<Array<{ item: WikiPage; category: string }>> => {
  const categories = await getCategories();
  const allPages: Array<{ item: WikiPage; category: string }> = [];
  
  for (const category of categories) {
    const pages = await getCategoryPages(category);
    pages.forEach(page => {
      allPages.push({ item: page, category });
    });
  }
  
  return allPages;
};

/**
 * Get home page for a category
 */
export const getCategoryHome = async (
  category: WikiCategory
): Promise<WikiPage | null> => {
  return loadPage(category, 'home');
};

/**
 * Filter pages by tag
 */
export const filterPagesByTag = (pages: WikiPage[], tag: string): WikiPage[] => {
  return pages.filter(page => page.tags?.includes(tag));
};

/**
 * Get related pages based on links
 */
export const getRelatedPages = async (
  page: WikiPage
): Promise<Record<string, Array<{ page: WikiPage; path: string }>>> => {
  const related: Record<string, Array<{ page: WikiPage; path: string }>> = {};
  
  if (!page.links || page.links.length === 0) {
    return related;
  }
  
  for (const link of page.links) {
    const relatedPage = await loadPage(
      link.to.split('/')[1] as WikiCategory,
      link.to.split('/')[2]
    );
    
    if (relatedPage) {
      const type = link.type || 'related';
      if (!related[type]) {
        related[type] = [];
      }
      related[type].push({ page: relatedPage, path: link.to });
    }
  }
  
  return related;
};