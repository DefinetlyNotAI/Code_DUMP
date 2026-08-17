import type {ExampleSet, RegexResult} from '@/types';
import * as u from './stringUtils';

// ═══════════════════════════════════════════════════════════════════
// REGEX GENERATOR — General algorithmic approach
//
// The core idea: tokenize each example into runs of same-type characters,
// align them across all positive examples using multiple sequence alignment,
// then progressively generalize each aligned column from concrete → abstract.
//
// Generalization levels for a column of tokens:
//   0. Exact literal text (all tokens have identical text)
//   1. Character class from exact char set [abc...]
//   2. Character class from CharType set (\d, [a-z], [a-zA-Z], ...)
//   3. Wildcard .
//
// We also detect:
//   - Common literal prefixes/suffixes (anchored or unanchored)
//   - Length constraints (exact, range, at-least, at-most)
//   - Discriminating substrings (present in all trues, absent from all falses)
//   - Structural templates (alternation of exact values)
//   - Positional properties (starts/ends with a char type, contains a type)
//
// Every candidate is verified against ALL positive and negative examples
// before being shown to the user.
// ═══════════════════════════════════════════════════════════════════

// ── Verification ──

function testRegex(pattern: string, flags: string, trues: string[], falses: string[]): boolean {
    try {
        const re = new RegExp(pattern, flags);
        for (const t of trues) if (!re.test(t)) return false;
        for (const f of falses) if (re.test(f)) return false;
        return true;
    } catch {
        return false;
    }
}

function testPartial(pattern: string, flags: string, trues: string[], falses: string[]): boolean {
    // For partial-match patterns (no ^...$), test() is correct
    return testRegex(pattern, flags, trues, falses);
}

function testFull(pattern: string, flags: string, trues: string[], falses: string[]): boolean {
    // For full-match patterns, wrap with ^...$ if not already anchored
    const anchored = pattern.startsWith('^') && pattern.endsWith('$');
    const p = anchored ? pattern : `^${pattern}$`;
    return testRegex(p, flags, trues, falses);
}

// ── Specificity scoring ──

function scoreSpecificity(pattern: string, trues: string[]): number {
    let score = 0;
    if (pattern.includes('^')) score += 12;
    if (pattern.includes('$')) score += 12;
    if (/\[[^\]]+]/.test(pattern)) score += 8;
    if (pattern.includes('\\d')) score += 6;
    if (pattern.includes('\\w')) score += 5;
    if (pattern.includes('\\s')) score += 4;
    if (/[+*?{]/.test(pattern)) score += 3;
    if (pattern.includes('|')) score += 5;
    if (pattern.includes('(')) score += 4;
    if (pattern === '.*' || pattern === '.+' || pattern === '.') score -= 30;
    if (/{\d+,\d+}/.test(pattern) || /{\d+}/.test(pattern)) score += 8;
    const literalChars = pattern.replace(/[.*+?^${}()|[\]\\]/g, '').length;
    score += Math.min(literalChars, 20);
    if (/^\.\**$/.test(pattern)) score -= 20;
    void trues;
    return Math.max(0, Math.min(100, score + 20));
}

// ── Result factory ──

let idCounter = 0;

function makeResult(
    pattern: string,
    flags: string,
    title: string,
    description: string,
    category: RegexResult['category'],
    examples: ExampleSet,
    fullMatch: boolean
): RegexResult | null {
    const valid = fullMatch
        ? testFull(pattern, flags, examples.true, examples.false)
        : testPartial(pattern, flags, examples.true, examples.false);
    if (!valid) return null;
    const id = `r${idCounter++}`;
    return {
        id,
        pattern,
        flags,
        title,
        description,
        category,
        specificity: scoreSpecificity(pattern, examples.true),
    };
}

// ═══════════════════════════════════════════════════════════════════
// SEGMENT-BASED GENERATION (the core engine)
// ═══════════════════════════════════════════════════════════════════

// A segment represents one part of the pattern. It can be:
// - A literal string
// - A character class
// - A wildcard
// Each with an optional quantifier.
interface Segment {
    kind: 'literal' | 'charclass' | 'wildcard';
    value: string;       // the regex fragment (without quantifier)
    quantifier: string;  // '', '+', '*', '?', '{n}', '{n,m}', etc.
    // For description purposes:
    desc: string;
}

function segmentToRegex(seg: Segment): string {
    return seg.value + seg.quantifier;
}

// Generalize a column of tokens at a given level.
// Returns a Segment or null if the column is all gaps.
function generalizeColumn(column: (u.Token | null)[], level: number): Segment | null {
    const tokens = column.filter((t): t is u.Token => t !== null);
    if (tokens.length === 0) return null;

    // Level 0: exact literal (all tokens must have identical text)
    if (level === 0) {
        const firstText = tokens[0].text;
        if (tokens.every(t => t.text === firstText)) {
            return {
                kind: 'literal',
                value: u.escapeRegex(firstText),
                quantifier: '',
                desc: `the literal text "${firstText}"`,
            };
        }
        return null;
    }

    // Level 1: character class from exact char set
    if (level === 1) {
        const allChars = new Set<string>();
        for (const t of tokens) for (const c of t.text) allChars.add(c);
        const chars = [...allChars].sort();
        if (chars.length === 0) return null;
        if (chars.length === 1) {
            // Single char — could be a shortcut
            const c = chars[0];
            const t = u.classifyChar(c);
            if (t === 'digit') return {kind: 'charclass', value: '\\d', quantifier: '', desc: 'a digit'};
            if (t === 'space') return {kind: 'charclass', value: '\\s', quantifier: '', desc: 'whitespace'};
            return {kind: 'charclass', value: u.escapeRegex(c), quantifier: '', desc: `the character "${c}"`};
        }
        // Check if all chars are the same type → use type-based class
        const types = new Set<u.CharType>();
        for (const c of chars) types.add(u.classifyChar(c));
        const classStr = `[${chars.map(u.escapeRegex).join('')}]`;
        return {
            kind: 'charclass',
            value: classStr,
            quantifier: '',
            desc: `one of: ${chars.map(c => `"${c}"`).join(', ')}`,
        };
    }

    // Level 2: character class from CharType set
    if (level === 2) {
        const types = new Set<u.CharType>();
        for (const t of tokens) for (const c of t.text) types.add(u.classifyChar(c));
        if (types.size === 0) return null;
        const classStr = u.charClassForTypes(types);
        let desc: string;
        if (types.size === 1) {
            const t = [...types][0];
            desc = t === 'digit' ? 'a digit' : t === 'lower' ? 'a lowercase letter' : t === 'upper' ? 'an uppercase letter' : t === 'space' ? 'whitespace' : 'a special character';
        } else {
            desc = `a ${[...types].map(t => t === 'digit' ? 'digit' : t === 'lower' ? 'lowercase letter' : t === 'upper' ? 'uppercase letter' : t === 'space' ? 'whitespace' : 'special char').join(' or ')}`;
        }
        return {kind: 'charclass', value: classStr, quantifier: '', desc};
    }

    // Level 3: wildcard
    return {kind: 'wildcard', value: '.', quantifier: '', desc: 'any character'};
}

// Determine the quantifier for a segment based on token lengths across the column.
function quantifierForColumn(column: (u.Token | null)[], level: number): string {
    const tokens = column.filter((t): t is u.Token => t !== null);
    if (tokens.length === 0) return '';

    // At level 0 (exact literal), quantifier is always '' (the text itself encodes length)
    if (level === 0) return '';

    // For other levels, compute length distribution
    const lengths = [...new Set(tokens.map(t => t.text.length))].sort((a, b) => a - b);

    if (lengths.length === 1) {
        if (lengths[0] === 1) return ''; // single char, no quantifier needed
        return `{${lengths[0]}}`;
    }

    const min = lengths[0];
    const max = lengths[lengths.length - 1];

    // If min is 0, use * or {0,max}
    if (min === 0) {
        if (max >= 10) return '*';
        return `{0,${max}}`;
    }

    // If max is very large, use +
    if (max >= 20) return `{${min},}`;

    return `{${min},${max}}`;
}

// Build a pattern from the MSA columns at a given generalization level.
// Adjacent segments of the same kind and type are merged with a quantifier.
function buildPatternFromMSA(
    msa: u.MSA,
    level: number,
    trues: string[]
): { pattern: string; description: string } | null {
    const segments: Segment[] = [];

    for (const column of msa.columns) {
        const seg = generalizeColumn(column, level);
        if (!seg) continue;

        // Compute quantifier based on the column's token lengths
        seg.quantifier = quantifierForColumn(column, level);

        // Try to merge
        segments.push(seg);
    }

    if (segments.length === 0) return null;

    // Post-process: merge adjacent segments with identical value+quantifier
    // into a single segment with combined quantifier.
    const merged: Segment[] = [];
    for (const seg of segments) {
        const prev = merged[merged.length - 1];
        if (prev && prev.kind === seg.kind && prev.value === seg.value && prev.quantifier === seg.quantifier) {
            // Same value and quantifier — we can merge by multiplying
            // But this is complex. Instead, let's just merge if quantifier is '' or {1}
            // and combine into a single {n} or {n,m}.
            // For simplicity, skip merging and just concatenate.
            merged.push(seg);
        } else {
            merged.push(seg);
        }
    }

    // Actually, let's do a smarter merge: collapse runs of identical segments
    // into a single segment with a combined quantifier.
    const final: Segment[] = [];
    let i = 0;
    while (i < segments.length) {
        const cur = segments[i];
        let runLen = 1;
        // Count how many consecutive segments have the same value
        // (quantifier may differ, but we'll combine)
        let j = i + 1;
        while (j < segments.length && segments[j].kind === cur.kind && segments[j].value === cur.value) {
            runLen++;
            j++;
        }

        if (runLen === 1) {
            final.push(cur);
        } else {
            // Merge: we need to figure out the combined quantifier.
            // Each segment in the run has its own quantifier (possibly '').
            // The combined quantifier should represent the total count range.
            // For simplicity, if all quantifiers are the same, multiply.
            // If they differ, just concatenate (still valid regex).
            const allSameQuant = segments.slice(i, j).every(s => s.quantifier === cur.quantifier);
            if (allSameQuant && cur.quantifier === '') {
                // All are single (no quantifier) → {runLen}
                final.push({
                    ...cur,
                    quantifier: `{${runLen}}`,
                    desc: cur.desc + ` (×${runLen})`,
                });
            } else if (allSameQuant) {
                // All same quantifier — keep it (approximation)
                final.push(cur);
            } else {
                // Different quantifiers — just concatenate
                for (let k = i; k < j; k++) final.push(segments[k]);
            }
        }
        i = j;
    }

    const pattern = final.map(segmentToRegex).join('');
    const descParts = final.map(s => {
        const q = s.quantifier;
        if (!q) return s.desc;
        if (q === '+') return `${s.desc} (one or more)`;
        if (q === '*') return `${s.desc} (zero or more)`;
        if (q === '?') return `${s.desc} (optional)`;
        if (q.match(/^{\d+}$/)) return `${s.desc} (×${q.slice(1, -1)})`;
        if (q.match(/^{\d+,\d*}$/)) return `${s.desc} (${q.slice(1, -1)} times)`;
        return `${s.desc} ${q}`;
    });

    const description = `Matches: ${descParts.join(' → ')}. Built by aligning all ${trues.length} positive example${trues.length !== 1 ? 's' : ''} and generalizing each position to ${level === 0 ? 'exact text' : level === 1 ? 'a character set' : level === 2 ? 'a character type class' : 'a wildcard'}.`;

    return {pattern, description};
}

// Generate segment-based patterns at multiple generalization levels.
function genSegmentBased(examples: ExampleSet): RegexResult[] {
    const results: RegexResult[] = [];
    const {true: trues} = examples;

    if (trues.length === 0) return results;

    const msa = u.multipleAlign(trues);
    if (msa.columns.length === 0) return results;

    const levelNames = ['Exact', 'Character Set', 'Character Type', 'Wildcard'];

    for (let level = 0; level <= 3; level++) {
        const built = buildPatternFromMSA(msa, level, trues);
        if (!built) continue;

        const title = level === 0 ? 'Exact Structure' : `Generalized Structure (${levelNames[level]})`;
        const r = makeResult(built.pattern, '', title, built.description, 'combined', examples, true);
        if (r) results.push(r);
    }

    // Also try anchored variants (prefix/suffix literal, middle generalized)
    const prefix = u.commonPrefix(trues);
    const suffix = u.commonSuffix(trues);

    if (prefix.length >= 2) {
        const p = u.escapeRegex(prefix);
        const r = makeResult(`^${p}`, '', 'Starts With Prefix', `Matches strings beginning with "${prefix}". The ^ anchor pins this to the start.`, 'anchor', examples, false);
        if (r) results.push(r);

        const r2 = makeResult(`^${p}.*`, '', 'Prefix + Anything', `Matches strings starting with "${prefix}" followed by any characters.`, 'anchor', examples, false);
        if (r2) results.push(r2);
    }

    if (suffix.length >= 2) {
        const s = u.escapeRegex(suffix);
        const r = makeResult(`${s}$`, '', 'Ends With Suffix', `Matches strings ending with "${suffix}". The $ anchor pins this to the end.`, 'anchor', examples, false);
        if (r) results.push(r);

        const r2 = makeResult(`.*${s}$`, '', 'Anything + Suffix', `Matches strings ending with "${suffix}" preceded by any characters.`, 'anchor', examples, false);
        if (r2) results.push(r2);
    }

    if (prefix.length >= 2 && suffix.length >= 2 && prefix !== suffix) {
        const p = u.escapeRegex(prefix);
        const s = u.escapeRegex(suffix);
        const r = makeResult(`^${p}.*${s}$`, '', 'Prefix + Suffix Bounded', `Matches strings starting with "${prefix}" and ending with "${suffix}", with anything in between.`, 'anchor', examples, true);
        if (r) results.push(r);
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════
// PROPERTY-BASED GENERATION
// ═══════════════════════════════════════════════════════════════════


// Generate property-based patterns: "contains digit", "no spaces", etc.
function genPropertyBased(examples: ExampleSet): RegexResult[] {
    const results: RegexResult[] = [];
    const {true: trues} = examples;

    // For each CharType, check if all trues contain it and some false doesn't
    const allTypes: u.CharType[] = ['digit', 'lower', 'upper', 'space', 'special'];
    const typeNames: Record<u.CharType, string> = {
        digit: 'a digit',
        lower: 'a lowercase letter',
        upper: 'an uppercase letter',
        space: 'whitespace',
        special: 'a special character',
    };
    const typeClass: Record<u.CharType, string> = {
        digit: '\\d',
        lower: '[a-z]',
        upper: '[A-Z]',
        space: '\\s',
        special: '[^a-zA-Z0-9\\s]',
    };

    for (const t of allTypes) {
        // "Contains X"
        if (trues.every(s => [...s].some(c => u.classifyChar(c) === t))) {
            const cls = typeClass[t];
            const r = makeResult(cls, '', `Contains ${typeNames[t].replace('a ', '').replace('an ', '')}`, `Matches any string containing at least ${typeNames[t]}.`, 'character-class', examples, false);
            if (r) results.push(r);
        }

        // "Does not contain X" (no falses have X, or some false has X)
        if (trues.every(s => ![...s].some(c => u.classifyChar(c) === t))) {
            const negated = t === 'digit' ? '\\D' : t === 'space' ? '\\S' : `[^${typeClass[t].slice(1, -1)}]`;
            // Actually for "does not contain X" we need: ^[^X]*$ (entire string has no X)
            const charInClass = typeClass[t].slice(1, -1); // e.g. "a-z" from "[a-z]"
            const noX = `^[^${charInClass}]*$`;
            const r = makeResult(noX, '', `No ${typeNames[t].replace('a ', '').replace('an ', '')}`, `Matches strings that contain no ${typeNames[t]} at all.`, 'character-class', examples, true);
            if (r) results.push(r);
            void negated;
        }
    }

    // Positional properties: starts/ends with a type
    for (const t of allTypes) {
        const cls = typeClass[t];
        const name = typeNames[t];

        // Starts with
        if (trues.every(s => s.length > 0 && u.classifyChar(s[0]) === t)) {
            const r = makeResult(`^${cls}`, '', `Starts With ${name.charAt(0).toUpperCase() + name.slice(1)}`, `Matches strings that begin with ${name}.`, 'anchor', examples, false);
            if (r) results.push(r);
        }

        // Ends with
        if (trues.every(s => s.length > 0 && u.classifyChar(s[s.length - 1]) === t)) {
            const r = makeResult(`${cls}$`, '', `Ends With ${name.charAt(0).toUpperCase() + name.slice(1)}`, `Matches strings that end with ${name}.`, 'anchor', examples, false);
            if (r) results.push(r);
        }
    }

    // Uniform type: all trues are entirely one type
    for (const t of allTypes) {
        if (trues.every(s => s.length > 0 && [...s].every(c => u.classifyChar(c) === t))) {
            const cls = typeClass[t];
            const name = typeNames[t];
            const r = makeResult(`^${cls}+$`, '', `Only ${name}`, `Matches strings consisting entirely of ${name}s (one or more).`, 'character-class', examples, true);
            if (r) results.push(r);

            // With length constraint
            const lengths = u.allLengths(trues);
            if (lengths.length === 1 && lengths[0] > 1) {
                const r2 = makeResult(`^${cls}{${lengths[0]}}$`, '', `Exactly ${lengths[0]} ${name}s`, `Matches strings of exactly ${lengths[0]} ${name}${lengths[0] !== 1 ? 's' : ''}.`, 'character-class', examples, true);
                if (r2) results.push(r2);
            } else if (lengths.length > 1) {
                const min = lengths[0];
                const max = lengths[lengths.length - 1];
                const r2 = makeResult(`^${cls}{${min},${max}}$`, '', `${min}-${max} ${name}s`, `Matches strings of ${min} to ${max} ${name}s.`, 'character-class', examples, true);
                if (r2) results.push(r2);
            }
        }
    }

    // Combined uniform type: all trues are entirely of a subset of types
    // e.g. all alphanumeric, all letters+digits
    const typeCombos: { types: u.CharType[]; cls: string; name: string }[] = [
        {types: ['lower', 'upper'], cls: '[a-zA-Z]', name: 'letters'},
        {types: ['lower', 'upper', 'digit'], cls: '[a-zA-Z0-9]', name: 'alphanumeric characters'},
        {types: ['lower', 'upper', 'digit', 'special'], cls: '[^\\s]', name: 'non-whitespace characters'},
    ];

    for (const combo of typeCombos) {
        if (trues.every(s => s.length > 0 && [...s].every(c => combo.types.includes(u.classifyChar(c))))) {
            const r = makeResult(`^${combo.cls}+$`, '', `Only ${combo.name}`, `Matches strings consisting entirely of ${combo.name}.`, 'character-class', examples, true);
            if (r) results.push(r);
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════
// LENGTH-BASED GENERATION
// ═══════════════════════════════════════════════════════════════════

function genLengthBased(examples: ExampleSet): RegexResult[] {
    const results: RegexResult[] = [];
    const {true: trues} = examples;

    const lengths = u.allLengths(trues);
    if (lengths.length === 0) return results;

    if (lengths.length === 1) {
        const len = lengths[0];
        const r = makeResult(`^.{${len}}$`, '', `Exactly ${len} Characters`, `Matches any string of exactly ${len} characters, regardless of content.`, 'quantifier', examples, true);
        if (r) results.push(r);

        const r2 = makeResult(`^.{${len},}$`, '', `At Least ${len} Characters`, `Matches strings of ${len} or more characters.`, 'quantifier', examples, true);
        if (r2) results.push(r2);
    }

    if (lengths.length > 1) {
        const min = lengths[0];
        const max = lengths[lengths.length - 1];

        const r = makeResult(`^.{${min},${max}}$`, '', `${min}-${max} Characters`, `Matches strings between ${min} and ${max} characters long.`, 'quantifier', examples, true);
        if (r) results.push(r);

        const r2 = makeResult(`^.{${min},}$`, '', `At Least ${min} Characters`, `Matches strings of ${min} or more characters.`, 'quantifier', examples, true);
        if (r2) results.push(r2);

        if (max < 100) {
            const r3 = makeResult(`^.{1,${max}}$`, '', `At Most ${max} Characters`, `Matches strings between 1 and ${max} characters long.`, 'quantifier', examples, true);
            if (r3) results.push(r3);
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════
// DISCRIMINATING SUBSTRING GENERATION
// ═══════════════════════════════════════════════════════════════════

function genSubstringBased(examples: ExampleSet): RegexResult[] {
    const results: RegexResult[] = [];
    const {true: trues, false: falses} = examples;

    const substrings = u.discriminatingSubstrings(trues, falses, 2);
    const seen = new Set<string>();
    const unique = substrings.filter(s => {
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
    }).slice(0, 4);

    for (const sub of unique) {
        const p = u.escapeRegex(sub);
        const r = makeResult(p, '', `Contains "${sub}"`, `Matches any string containing "${sub}" anywhere within it. This substring appears in all positive examples and in none of the negative ones.`, 'literal', examples, false);
        if (r) results.push(r);

        const r2 = makeResult(`.*${p}.*`, '', `Contains "${sub}" (Explicit)`, `Same as above but with explicit .* on both sides, making the "anywhere" behavior explicit.`, 'wildcard', examples, false);
        if (r2) results.push(r2);
    }

    // Also try the longest common substring
    const lcs = u.longestCommonSubstring(trues, 2);
    if (lcs && !unique.includes(lcs)) {
        const p = u.escapeRegex(lcs);
        const r = makeResult(p, '', `Contains "${lcs}"`, `Matches any string containing "${lcs}" — the longest substring shared by all your positive examples.`, 'literal', examples, false);
        if (r) results.push(r);
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════
// ALTERNATION GENERATION
// ═══════════════════════════════════════════════════════════════════

function genAlternation(examples: ExampleSet): RegexResult[] {
    const results: RegexResult[] = [];
    const {true: trues} = examples;

    if (trues.length >= 2 && trues.length <= 8) {
        const parts = trues.map(u.escapeRegex);
        const pattern = `^(${parts.join('|')})$`;
        const r = makeResult(pattern, '', 'Exact Alternation', `Matches exactly one of: ${trues.map(t => `"${t}"`).join(', ')}. An explicit OR of all accepted values — the most precise but least general pattern.`, 'alternation', examples, true);
        if (r) results.push(r);
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════
// DELIMITER-BASED GENERATION (general)
// ═══════════════════════════════════════════════════════════════════

// Detect if all trues share a common delimiter character that splits them
// into a consistent number of parts. This is general — not hardcoded to
// specific delimiters.
function genDelimiterBased(examples: ExampleSet): RegexResult[] {
    const results: RegexResult[] = [];
    const {true: trues} = examples;

    if (trues.length === 0) return results;

    // Find all candidate delimiter characters: any special char or space
    // that appears in ALL trues
    const candidateChars = new Set<string>();
    for (const c of trues[0]) {
        if (u.classifyChar(c) === 'special' || u.classifyChar(c) === 'space') {
            if (trues.every(s => s.includes(c))) {
                candidateChars.add(c);
            }
        }
    }

    for (const delim of candidateChars) {
        const d = u.escapeRegex(delim);
        // Count parts in each true
        const partCounts = trues.map(s => s.split(delim).filter(p => p.length > 0).length);
        if (partCounts.every(c => c === partCounts[0] && c >= 2)) {
            const numParts = partCounts[0];
            // Build: ^([^d]+d){n-1}[^d]+$
            const partPattern = `[^${d.replace('\\', '\\\\')}]+`;
            const full = `^${partPattern}(${d}${partPattern}){${numParts - 1}}$`;
            const r = makeResult(full, '', `Delimited by "${delim}" (${numParts} parts)`, `Matches strings with ${numParts} segments separated by "${delim}". Each segment contains one or more non-delimiter characters.`, 'combined', examples, true);
            if (r) results.push(r);

            // Flexible version
            const flex = `^${partPattern}(${d}${partPattern})*$`;
            const r2 = makeResult(flex, '', `Delimited by "${delim}" (flexible)`, `Matches strings with one or more segments separated by "${delim}". The number of segments can vary.`, 'combined', examples, true);
            if (r2) results.push(r2);
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════
// HYBRID: prefix/suffix + generalized middle
// ═══════════════════════════════════════════════════════════════════

function genHybrid(examples: ExampleSet): RegexResult[] {
    const results: RegexResult[] = [];
    const {true: trues} = examples;

    const prefix = u.commonPrefix(trues);
    const suffix = u.commonSuffix(trues);

    // Strip prefix and suffix from each true, then analyze the middle
    if (prefix.length >= 1 || suffix.length >= 1) {
        const middles = trues.map(s => {
            let m = s;
            if (prefix.length > 0 && m.startsWith(prefix)) m = m.slice(prefix.length);
            if (suffix.length > 0 && m.endsWith(suffix)) m = m.slice(0, m.length - suffix.length);
            return m;
        }).filter(m => m.length > 0);

        if (middles.length > 0 && middles.some(m => m !== trues[0])) {
            // Analyze the middle parts
            const midTypes = new Set<u.CharType>();
            for (const m of middles) for (const c of m) midTypes.add(u.classifyChar(c));

            if (midTypes.size > 0) {
                const midClass = u.charClassForTypes(midTypes);
                const midLengths = u.allLengths(middles);
                const midQuant = u.quantifierForLengths(midLengths);

                const p = prefix.length > 0 ? u.escapeRegex(prefix) : '';
                const s = suffix.length > 0 ? u.escapeRegex(suffix) : '';

                const pattern = `^${p}${midClass}${midQuant}${s}$`;
                const desc = `Matches strings with prefix "${prefix}", a ${midTypes.size}-type middle section (${midClass}${midQuant}), and suffix "${suffix}". Discovered by stripping shared prefix/suffix and analyzing the variable middle.`;

                const r = makeResult(pattern, '', 'Prefix + Variable Middle + Suffix', desc, 'combined', examples, true);
                if (r) results.push(r);
            }
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════

export function generateRegexes(examples: ExampleSet): RegexResult[] {
    idCounter = 0;
    const all: RegexResult[] = [];
    const seen = new Set<string>();

    const generators = [
        genSegmentBased,
        genPropertyBased,
        genLengthBased,
        genSubstringBased,
        genAlternation,
        genDelimiterBased,
        genHybrid,
    ];

    for (const gen of generators) {
        try {
            const results = gen(examples);
            for (const r of results) {
                const key = r.pattern + '|' + r.flags;
                if (!seen.has(key)) {
                    seen.add(key);
                    all.push(r);
                }
            }
        } catch {
            // skip failed generators
        }
    }

    // Sort by specificity descending
    all.sort((a, b) => b.specificity - a.specificity);

    return all;
}

// ── Live testing utility ──

export interface TestMatch {
    text: string;
    matched: boolean;
    matches: { match: string; index: number }[];
}

export function testAgainstInput(pattern: string, flags: string, text: string): TestMatch {
    try {
        const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
        const matches: { match: string; index: number }[] = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            matches.push({match: m[0], index: m.index});
            if (m.index === re.lastIndex) re.lastIndex++;
        }
        return {text, matched: matches.length > 0, matches};
    } catch {
        return {text, matched: false, matches: []};
    }
}
