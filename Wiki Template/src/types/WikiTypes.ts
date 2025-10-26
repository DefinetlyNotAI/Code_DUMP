/**
 * Core types for the wiki system
 */

// Rating type
export type Rating = 1 | 2 | 3 | 4 | 5;

// Base wiki page schema
export interface WikiPageBase {
  title: string;
  order?: number;
  tags?: string[];
  icon?: string;
  text: Record<string, string>;
  md?: boolean;
  links?: WikiPageLink[];
  images?: WikiPageImage[];
  meta?: WikiPageMeta;
  rating?: Rating;
}

// Page link type
export interface WikiPageLink {
  to: string;
  label: string;
  type?: string;
}

// Page image type
export interface WikiPageImage {
  src: string;
  alt: string;
  caption?: string;
}

// Page metadata
export interface WikiPageMeta {
  created?: string;
  updated?: string;
  status?: 'draft' | 'incomplete' | 'complete';
}

// Ascension level type
export interface AscensionLevel {
  level: number;
  experience?: number;
  gold?: number;
  items?: Array<{
    name: string;
    quantity: number;
  }>;
  stats?: {
    [key: string]: number;
  };
  abilities?: string[];
}

// Character schema
export interface CharacterPage extends WikiPageBase {
  stats?: {
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    charisma?: number;
    health?: number;
    mana?: number;
    [key: string]: number | undefined;
  };
  affiliations?: string[];
  relationships?: Array<{
    character: string;
    relationship: string;
  }>;
  ascension?: {
    current: number;
    levels: {
      [key: number]: AscensionLevel;
    };
  };
  build?: {
    recommended_items?: string[];
    recommended_abilities?: string[];
    synergies?: Array<{
      character: string;
      description: string;
    }>;
    counters?: Array<{
      character: string;
      description: string;
    }>;
  };
}

// Item schema
export interface ItemPage extends WikiPageBase {
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats?: Record<string, number | string>;
  craftable?: boolean;
  craftingMaterials?: Array<{
    item: string;
    quantity: number;
  }>;
}

// Location schema
export interface LocationPage extends WikiPageBase {
  coordinates?: {
    x: number;
    y: number;
  };
  inhabitants?: string[];
  pointsOfInterest?: string[];
  dangerLevel?: number;
}

// Quest schema
export interface QuestPage extends WikiPageBase {
  level?: number;
  rewards?: Array<{
    type: string;
    value: string | number;
  }>;
  prerequisites?: string[];
  steps?: string[];
}

// Ability schema
export interface AbilityPage extends WikiPageBase {
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

// Enemy schema
export interface EnemyPage extends WikiPageBase {
  level: number;
  type: string;
  stats: {
    health: number;
    attack: number;
    defense: number;
    [key: string]: number;
  };
  abilities?: string[];
  drops?: Array<{
    item: string;
    chance: number;
    quantity?: {
      min: number;
      max: number;
    };
  }>;
  weaknesses?: string[];
  resistances?: string[];
  locations?: string[];
  spawnConditions?: string[];
}

// Wiki category type
export type WikiCategory = string;

// Union type of all page types
export type WikiPage = CharacterPage | ItemPage | LocationPage | QuestPage | AbilityPage | EnemyPage;