export interface RegexResult {
    id: string;
    pattern: string;
    flags: string;
    title: string;
    description: string;
    category: RegexCategory;
    specificity: number; // 0-100, higher = more specific
}

export type RegexCategory =
    | 'literal'
    | 'character-class'
    | 'anchor'
    | 'quantifier'
    | 'group'
    | 'alternation'
    | 'wildcard'
    | 'combined';

export interface ExampleSet {
    true: string[];
    false: string[];
}
