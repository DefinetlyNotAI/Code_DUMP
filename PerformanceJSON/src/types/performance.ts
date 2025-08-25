export interface LighthouseMetrics {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface MemoryMetrics {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

export interface PageData {
  route: string;
  load_time_ms: number;
  text_words: number;
  dom_nodes: number;
  local_storage_kb: number;
  cookies: string[];
  lighthouse: LighthouseMetrics;
  memory: MemoryMetrics;
}

export interface AssetBreakdown {
  file: string;
  size_kb: string;
}

export interface PublicAssets {
  total_size: string;
  breakdown: AssetBreakdown[];
  by_extension: Record<string, AssetBreakdown[]>;
}

export interface GlobalMetrics {
  total_routes_tested: number;
  average_load_time_ms: number;
  average_dom_nodes: number;
  average_text_words: number;
}

export interface ComponentFile {
  file: string;
  text_words: number;
  dom_nodes: number;
}

export interface PerformanceData {
  pages: PageData[];
  global: GlobalMetrics;
  public_assets: PublicAssets;
  git_commit: string;
  certs: AssetBreakdown[];
  hooks: ComponentFile[];
  components: ComponentFile[];
  lib: ComponentFile[];
  next_static_chunks: {
    total_size: string;
    breakdown: AssetBreakdown[];
  };
}