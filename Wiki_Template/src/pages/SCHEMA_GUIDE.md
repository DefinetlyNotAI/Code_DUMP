# How to Create Your Own Wiki Pages

This guide explains how to create new pages for your wiki using our schema system. Each page type has its own schema with specific fields and options.

## Common Fields (All Page Types)

Every page type shares these base fields:

```typescript
{
  title: string;              // Page title
  order?: number;            // Optional: controls sort order within category
  tags?: string[];          // For filtering/categorization
  icon?: string;           // Optional emoji or image URL
  rating?: 1 | 2 | 3 | 4 | 5; // Rarity rating (Common to Legendary)
  text: Record<string, string>;  // Content sections
  md?: boolean;           // Enable markdown in text fields
  links?: Array<{
    to: string;          // Path to linked page
    label: string;      // Display text
    type?: string;     // Optional link type for grouping
  }>;
  images?: Array<{
    src: string;      // Image URL
    alt: string;     // Alt text
    caption?: string; // Optional caption
  }>;
  meta?: {
    created?: string;   // Creation date
    updated?: string;  // Last update date
    status?: 'wip';   // Work in progress indicator
  };
}
```

## Character Pages

Characters have additional fields for stats, relationships, and progression:

```typescript
{
  // ... common fields ...
  stats?: {
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    charisma?: number;
    health?: number;
    mana?: number;
    [key: string]: number;  // Custom stats
  };
  affiliations?: string[];
  relationships?: Array<{
    character: string;
    relationship: string;
  }>;
  ascension?: {
    current: number;
    levels: {
      [key: number]: {
        level: number;
        experience: number;
        gold: number;
        items: Array<{
          name: string;
          quantity: number;
        }>;
        stats: Record<string, number>;
        abilities: string[];
      };
    };
  };
}
```

## Enemy Pages

Enemies track difficulty levels, stats, and drops:

```typescript
{
  // ... common fields ...
  difficulty: {
    current: number;
    levels: {
      [key: number]: {
        level: number;
        stats: {
          health: number;
          attack: number;
          defense: number;
          [key: string]: number;
        };
        drops: Array<{
          item: string;
          chance: number;
          quantity?: {
            min: number;
            max: number;
          };
        }>;
        abilities: string[];
      };
    };
  };
  weaknesses?: string[];
  resistances?: string[];
  locations?: string[];
  spawnConditions?: string[];
}
```

## Item Pages

Items track rarity, stats, and crafting information:

```typescript
{
  // ... common fields ...
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats?: Record<string, number | string>;
  craftable?: boolean;
  craftingMaterials?: Array<{
    item: string;
    quantity: number;
  }>;
}
```

## Location Pages

Locations include geographical and inhabitant information:

```typescript
{
  // ... common fields ...
  coordinates?: {
    x: number;
    y: number;
  };
  inhabitants?: string[];
  pointsOfInterest?: string[];
  dangerLevel?: number;
}
```

## Quest Pages

Quests track requirements, steps, and rewards:

```typescript
{
  // ... common fields ...
  level?: number;
  rewards?: Array<{
    type: string;
    value: string | number;
  }>;
  prerequisites?: string[];
  steps?: string[];
}
```

## Ability Pages

Abilities include combat and upgrade information:

```typescript
{
  // ... common fields ...
  damage?: number | string;
  manaCost?: number;
  cooldown?: number;
  range?: number | string;
  upgrades?: Array<{
    name: string;
    description: string;
    level: number;
  }>;
}
```

## Advanced Development Guide

### Custom Schema Extensions

You can extend the base schemas to add custom functionality:

1. Update the TypeScript types in `src/types/WikiTypes.ts`:

```typescript
// Add custom interfaces
interface CustomStats {
  customStat1: number;
  customStat2: string;
}

// Extend existing types
interface ExtendedCharacterPage extends CharacterPage {
  customStats?: CustomStats;
  specialAbilities?: string[];
}
```

2. Create a custom schema validator:

```typescript
// src/utils/schemaValidation.ts
import { z } from 'zod';

const CustomStatsSchema = z.object({
  customStat1: z.number(),
  customStat2: z.string()
});

const ExtendedCharacterSchema = CharacterSchema.extend({
  customStats: CustomStatsSchema.optional(),
  specialAbilities: z.array(z.string()).optional()
});
```

3. Add custom rendering components:

```typescript
// src/components/CustomStatsDisplay.tsx
interface CustomStatsDisplayProps {
  stats: CustomStats;
}

const CustomStatsDisplay: React.FC<CustomStatsDisplayProps> = ({ stats }) => {
  return (
    <div className="custom-stats">
      <h3>Custom Stats</h3>
      <div>{stats.customStat1}</div>
      <div>{stats.customStat2}</div>
    </div>
  );
};
```

### Adding New Page Types

To add a new page type:

1. Define the TypeScript interface:

```typescript
// src/types/WikiTypes.ts
export interface NewPageType extends WikiPageBase {
  specialField1: string;
  specialField2: number;
  customData: Record<string, unknown>;
}
```

2. Create a renderer component:

```typescript
// src/components/NewPageRenderer.tsx
interface NewPageRendererProps {
  page: NewPageType;
}

const NewPageRenderer: React.FC<NewPageRendererProps> = ({ page }) => {
  return (
    <div>
      <h1>{page.title}</h1>
      <div>{page.specialField1}</div>
      <div>{page.specialField2}</div>
      {/* Custom rendering logic */}
    </div>
  );
};
```

3. Update the page utils:

```typescript
// src/utils/pageUtils.ts
export const loadNewPageType = async (
  slug: string
): Promise<NewPageType | null> => {
  // Implementation
};
```

### Custom Functionality

#### Adding Search Providers

Create custom search implementations:

```typescript
// src/utils/search/customSearch.ts
interface SearchProvider {
  search(query: string): Promise<SearchResult[]>;
  index(pages: WikiPage[]): void;
}

class CustomSearchProvider implements SearchProvider {
  private searchIndex: any;

  constructor() {
    this.searchIndex = new CustomSearchIndex();
  }

  async search(query: string): Promise<SearchResult[]> {
    // Implementation
  }

  index(pages: WikiPage[]): void {
    // Implementation
  }
}
```

#### Custom Data Sources

Implement custom data loading:

```typescript
// src/utils/dataSources/customSource.ts
interface DataSource {
  load(): Promise<WikiPage[]>;
  save(page: WikiPage): Promise<void>;
}

class CustomDataSource implements DataSource {
  async load(): Promise<WikiPage[]> {
    // Implementation
  }

  async save(page: WikiPage): Promise<void> {
    // Implementation
  }
}
```

### Performance Optimization

1. Implement page caching:

```typescript
// src/utils/cache.ts
class PageCache {
  private cache: Map<string, WikiPage>;
  private ttl: number;

  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key: string): WikiPage | undefined {
    // Implementation
  }

  set(key: string, page: WikiPage): void {
    // Implementation
  }
}
```

2. Add lazy loading for images:

```typescript
// src/components/LazyImage.tsx
const LazyImage: React.FC<ImageProps> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={`transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};
```

### Testing

Create comprehensive tests:

```typescript
// src/tests/schema.test.ts
describe('Wiki Schema', () => {
  test('validates character page', () => {
    const page = {
      title: 'Test Character',
      // ... other fields
    };
    
    expect(validateCharacterPage(page)).toBeTruthy();
  });
});
```

### Error Handling

Implement robust error handling:

```typescript
// src/utils/errors.ts
class WikiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'WikiError';
  }
}

export const handlePageError = (error: unknown): void => {
  if (error instanceof WikiError) {
    // Handle specific error types
  } else {
    // Handle unknown errors
  }
};
```

## Best Practices

1. **Type Safety**: Always use TypeScript types and interfaces
2. **Validation**: Validate data before saving/loading
3. **Error Handling**: Implement comprehensive error handling
4. **Testing**: Write tests for critical functionality
5. **Documentation**: Keep documentation updated
6. **Performance**: Implement caching and optimization where needed
7. **Modularity**: Keep components and utilities modular and reusable