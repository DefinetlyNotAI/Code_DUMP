// General-purpose string analysis primitives for the regex generator.
// No hardcoded patterns — everything is derived from the data.

export function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Character classification ──

export type CharType = 'digit' | 'lower' | 'upper' | 'space' | 'special';

export function isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
}

export function isLower(c: string): boolean {
    return c >= 'a' && c <= 'z';
}

export function isUpper(c: string): boolean {
    return c >= 'A' && c <= 'Z';
}

export function isWhitespace(c: string): boolean {
    return /\s/.test(c);
}

export function classifyChar(c: string): CharType {
    if (isDigit(c)) return 'digit';
    if (isLower(c)) return 'lower';
    if (isUpper(c)) return 'upper';
    if (isWhitespace(c)) return 'space';
    return 'special';
}

// The broadest regex char-class that covers a set of CharTypes.
// Returns a fragment like \d, [a-z], [a-zA-Z], [a-zA-Z0-9], etc.
export function charClassForTypes(types: Set<CharType>): string {
    const has = (t: CharType) => types.has(t);

    // Single-type shortcuts
    if (types.size === 1) {
        const t = [...types][0];
        if (t === 'digit') return '\\d';
        if (t === 'space') return '\\s';
        if (t === 'lower') return '[a-z]';
        if (t === 'upper') return '[A-Z]';
        return '[^a-zA-Z0-9\\s]'; // special only
    }

    // Multi-type combinations
    if (has('lower') && has('upper') && !has('digit') && !has('space') && !has('special'))
        return '[a-zA-Z]';
    if (has('lower') && has('upper') && has('digit') && !has('space') && !has('special'))
        return '[a-zA-Z0-9]';
    if (has('lower') && has('upper') && has('digit') && has('special') && !has('space'))
        return '[^\\s]';
    if (has('digit') && has('special') && !has('lower') && !has('upper') && !has('space'))
        return '[^a-zA-Z\\s]';
    if (has('lower') && has('digit') && !has('upper') && !has('space') && !has('special'))
        return '[a-z0-9]';
    if (has('upper') && has('digit') && !has('lower') && !has('space') && !has('special'))
        return '[A-Z0-9]';

    // If space is included, it's very broad — just use .
    return '.';
}

// ── Tokenization ──

// A token is a maximal run of characters of the same CharType.
export interface Token {
    type: CharType;
    text: string;
    start: number;
    end: number;
}

export function tokenize(s: string): Token[] {
    const tokens: Token[] = [];
    if (s.length === 0) return tokens;
    let i = 0;
    while (i < s.length) {
        const type = classifyChar(s[i]);
        let j = i + 1;
        while (j < s.length && classifyChar(s[j]) === type) j++;
        tokens.push({type, text: s.slice(i, j), start: i, end: j});
        i = j;
    }
    return tokens;
}

// ── Sequence alignment (Levenshtein-style) ──

export interface Alignment {
    cost: number;
    ops: AlignOp[];
}

export type AlignOp =
    | { type: 'match'; a: Token; b: Token }
    | { type: 'substitute'; a: Token; b: Token }
    | { type: 'delete'; a: Token }
    | { type: 'insert'; b: Token };

// Align two token sequences. Cost: match=0, sub=1, del/ins=1.
// This is a standard Needleman-Wunsch with linear gap penalty.
export function alignTokens(a: Token[], b: Token[]): Alignment {
    const n = a.length;
    const m = b.length;
    if (n === 0) return {cost: m, ops: b.map(tok => ({type: 'insert' as const, b: tok}))};
    if (m === 0) return {cost: n, ops: a.map(tok => ({type: 'delete' as const, a: tok}))};

    // dp[i][j] = min cost to align a[0..i) with b[0..j)
    const dp: number[][] = Array.from({length: n + 1}, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) dp[i][0] = i;
    for (let j = 0; j <= m; j++) dp[0][j] = j;

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const matchCost = a[i - 1].type === b[j - 1].type ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j - 1] + matchCost,
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1
            );
        }
    }

    // Backtrace
    const ops: AlignOp[] = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0) {
            const matchCost = a[i - 1].type === b[j - 1].type ? 0 : 1;
            if (dp[i][j] === dp[i - 1][j - 1] + matchCost) {
                if (matchCost === 0) ops.push({type: 'match', a: a[i - 1], b: b[j - 1]});
                else ops.push({type: 'substitute', a: a[i - 1], b: b[j - 1]});
                i--;
                j--;
                continue;
            }
        }
        if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
            ops.push({type: 'delete', a: a[i - 1]});
            i--;
            continue;
        }
        ops.push({type: 'insert', b: b[j - 1]});
        j--;
    }
    ops.reverse();
    return {cost: dp[n][m], ops};
}

// ── Multiple sequence alignment (star alignment) ──

// A "column" in the alignment represents one position across all strings.
// Each column entry is either a Token or null (gap).
export type Column = (Token | null)[];

export interface MSA {
    columns: Column[];
    seqCount: number;
}

// Align all sequences to a reference (the first sequence) using star alignment.
// This is O(n * m) where n = number of sequences, m = avg length.
export function multipleAlign(strings: string[]): MSA {
    const tokenSeqs = strings.map(tokenize);
    if (tokenSeqs.length === 0) return {columns: [], seqCount: 0};
    if (tokenSeqs.length === 1) {
        return {
            columns: tokenSeqs[0].map(tok => [tok]),
            seqCount: 1,
        };
    }

    // Use the first sequence as reference, align all others to it.
    const ref = tokenSeqs[0];

    // For the reference, it maps directly
    // For each other sequence, we align it to the reference and insert gaps.
    // We track which reference positions each other seq's tokens map to.

    // Build a matrix: aligned[k][refPos] = Token or null
    // refPos goes from 0 to ref.length
    const refLen = ref.length;
    const gapMatrix: (Token | null)[][][] = tokenSeqs.map(() => []);

    for (let k = 0; k < tokenSeqs.length; k++) {
        const seq = tokenSeqs[k];
        if (k === 0) {
            // Reference maps directly
            for (let p = 0; p < refLen; p++) gapMatrix[k].push([ref[p]]);
            continue;
        }
        const aln = alignTokens(ref, seq);
        // Walk through ops and assign to ref positions
        let refPos = 0;
        const extraGaps: Token[] = []; // tokens that don't align to any ref position
        for (const op of aln.ops) {
            if (op.type === 'match' || op.type === 'substitute') {
                // This ref position gets this token
                if (!gapMatrix[k][refPos]) gapMatrix[k][refPos] = [];
                gapMatrix[k][refPos].push(op.b);
                refPos++;
            } else if (op.type === 'delete') {
                // Reference has a token, seq has a gap
                if (!gapMatrix[k][refPos]) gapMatrix[k][refPos] = [];
                gapMatrix[k][refPos].push(null);
                refPos++;
            } else if (op.type === 'insert') {
                // Seq has a token that doesn't correspond to any ref position
                extraGaps.push(op.b);
            }
        }
        // If there are extra tokens at the end, attach them to the last column
        if (extraGaps.length > 0 && refLen > 0) {
            if (!gapMatrix[k][refLen - 1]) gapMatrix[k][refLen] = [];
            gapMatrix[k][refLen - 1].push(...extraGaps);
        }
    }

    // Now build columns. Each column corresponds to one ref position.
    // Within a column, we may have multiple tokens from a single sequence
    // (due to insertions). We need to handle this by splitting into sub-columns.
    // For simplicity, we'll flatten: each column has exactly one entry per sequence,
    // and if a sequence has multiple tokens at a ref position, we create sub-columns.

    const columns: Column[] = [];
    for (let p = 0; p < refLen; p++) {
        // For each sequence, get the tokens at this ref position
        const seqTokens: (Token | null)[][] = [];
        let maxTokens = 1;
        for (let k = 0; k < tokenSeqs.length; k++) {
            const arr = gapMatrix[k][p] || [null];
            seqTokens.push(arr);
            if (arr.length > maxTokens) maxTokens = arr.length;
        }
        // Create sub-columns
        for (let sub = 0; sub < maxTokens; sub++) {
            const col: Column = [];
            for (let k = 0; k < tokenSeqs.length; k++) {
                col.push(seqTokens[k][sub] || null);
            }
            columns.push(col);
        }
    }

    return {columns, seqCount: tokenSeqs.length};
}

// ── Common prefix / suffix ──

export function commonPrefix(strs: string[]): string {
    if (strs.length === 0) return '';
    let min = strs[0];
    for (const s of strs) if (s.length < min.length) min = s;
    let i = 0;
    while (i < min.length && strs.every(s => s[i] === min[i])) i++;
    return min.slice(0, i);
}

export function commonSuffix(strs: string[]): string {
    if (strs.length === 0) return '';
    let min = strs[0];
    for (const s of strs) if (s.length < min.length) min = s;
    let i = 0;
    while (i < min.length && strs.every(s => s[s.length - 1 - i] === min[min.length - 1 - i])) i++;
    return min.slice(min.length - i);
}

// ── Length utilities ──

export function allLengths(strs: string[]): number[] {
    return [...new Set(strs.map(s => s.length))].sort((a, b) => a - b);
}

// ── Substring search ──

// Find the longest common substring among all strings (min length 2)
export function longestCommonSubstring(strs: string[], minLen = 2): string | null {
    if (strs.length === 0) return null;
    const first = strs[0];
    let best: string | null = null;
    for (let len = first.length; len >= minLen; len--) {
        for (let start = 0; start <= first.length - len; start++) {
            const sub = first.slice(start, start + len);
            if (strs.every(s => s.includes(sub))) {
                if (!best || sub.length > best.length) best = sub;
            }
        }
        if (best && best.length === len) return best;
    }
    return best;
}

// Find all common substrings of length >= minLen that appear in all trues but no falses
export function discriminatingSubstrings(trues: string[], falses: string[], minLen = 2): string[] {
    if (trues.length === 0) return [];
    const first = trues[0];
    const found: string[] = [];
    const seen = new Set<string>();
    for (let len = Math.min(first.length, 20); len >= minLen; len--) {
        for (let start = 0; start <= first.length - len; start++) {
            const sub = first.slice(start, start + len);
            if (seen.has(sub)) continue;
            seen.add(sub);
            if (trues.every(s => s.includes(sub)) && falses.every(f => !f.includes(sub))) {
                found.push(sub);
            }
        }
        if (found.length > 0) break;
    }
    return found;
}

// ── Quantifier helpers ──

// Given a set of lengths, produce a compact quantifier string.
// E.g. [3] -> "{3}", [3,4,5] -> "{3,5}", [3,5] -> "{3,5}"
export function quantifierForLengths(lengths: number[]): string {
    if (lengths.length === 0) return '+';
    if (lengths.length === 1) return `{${lengths[0]}}`;
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    if (min === max) return `{${min}}`;
    return `{${min},${max}}`;
}