import {useCallback, useMemo, useState} from 'react';
import {BookOpen, Github, Regex, Sparkles, Trash2, Wand2, Zap} from 'lucide-react';
import {ExampleSection} from '@/components/ExampleSection';
import {RegexCard} from '@/components/RegexCard';
import {generateRegexes} from '@/lib/regexGenerator';
import type {ExampleSet, RegexResult} from '@/types';

interface Preset {
    name: string;
    description: string;
    examples: ExampleSet;
}

const presets: Preset[] = [
    {
        name: 'Phone Numbers',
        description: 'Various phone number formats',
        examples: {
            true: ['555-1234', '555-9876', '123-4567'],
            false: ['hello', '555', 'abc-defg'],
        },
    },
    {
        name: 'Email Addresses',
        description: 'Standard email format',
        examples: {
            true: ['user@example.com', 'test@domain.org', 'name@site.net'],
            false: ['notanemail', '@domain.com', 'user@'],
        },
    },
    {
        name: 'Hex Colors',
        description: 'CSS hex color codes',
        examples: {
            true: ['#fff', '#a1b2c3', '#ff5733'],
            false: ['#zzz', 'fff', '#12', '#1234567'],
        },
    },
    {
        name: 'IP Addresses',
        description: 'IPv4 format',
        examples: {
            true: ['192.168.1.1', '10.0.0.1', '255.255.255.0'],
            false: ['999.1.1.1', '1.2.3', 'abc.def.ghi.jkl'],
        },
    },
    {
        name: 'Dates',
        description: 'Date formats',
        examples: {
            true: ['2024-01-15', '12/25/2023', '2023/06/10'],
            false: ['not-a-date', '2024', '25-25-25'],
        },
    },
    {
        name: 'Usernames',
        description: 'Alphanumeric usernames',
        examples: {
            true: ['john_doe', 'user123', 'Alice'],
            false: ['has space', 'spec!al', ''],
        },
    },
];

function App() {
    const [trueExamples, setTrueExamples] = useState<string[]>([]);
    const [falseExamples, setFalseExamples] = useState<string[]>([]);
    const [results, setResults] = useState<RegexResult[]>([]);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const canGenerate = trueExamples.length >= 1 && falseExamples.length >= 1;

    const handleGenerate = useCallback(() => {
        if (!canGenerate) return;
        const generated = generateRegexes({true: trueExamples, false: falseExamples});
        setResults(generated);
        setHasGenerated(true);
    }, [trueExamples, falseExamples, canGenerate]);

    const handleClear = () => {
        setTrueExamples([]);
        setFalseExamples([]);
        setResults([]);
        setHasGenerated(false);
        setActivePreset(null);
    };

    const loadPreset = (preset: Preset) => {
        setTrueExamples([...preset.examples.true]);
        setFalseExamples([...preset.examples.false]);
        setActivePreset(preset.name);
        setResults([]);
        setHasGenerated(false);
    };

    const stats = useMemo(() => {
        if (!hasGenerated) return null;
        return {
            total: results.length,
            categories: new Set(results.map(r => r.category)).size,
            best: results[0]?.specificity ?? 0,
        };
    }, [results, hasGenerated]);

    return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"/>
                <div
                    className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]"/>
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px]"/>
            </div>

            {/* Grid overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-20 bg-slate-950/70">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div
                                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                    <Regex className="w-5 h-5 text-slate-950"/>
                                </div>
                                <div
                                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950"/>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight">Regex Playground</h1>
                                <p className="text-xs text-white/40">Generate regex from examples — no AI, pure
                                    algorithm</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                            >
                                <BookOpen className="w-4 h-4"/>
                                <span className="hidden sm:inline">Docs</span>
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                            >
                                <Github className="w-4 h-4"/>
                                <span className="hidden sm:inline">Source</span>
                            </a>
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 text-center">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-5">
                        <Zap className="w-3.5 h-3.5 text-cyan-400"/>
                        Instant generation from examples
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                        Describe it with{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              examples
            </span>
                        ,<br/>
                        not syntax.
                    </h2>
                    <p className="text-lg text-white/50 max-w-2xl mx-auto">
                        Provide strings that should match and strings that shouldn't. The generator analyzes patterns
                        and produces multiple regex rules with clear explanations.
                    </p>
                </section>

                {/* Main content */}
                <main className="max-w-7xl mx-auto px-6 pb-20">
                    {/* Presets */}
                    <div className="mb-8">
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Quick
                            Examples</p>
                        <div className="flex flex-wrap gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => loadPreset(preset)}
                                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                                        activePreset === preset.name
                                            ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                                            : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                                    }`}
                                    title={preset.description}
                                >
                                    <Sparkles className="w-3.5 h-3.5"/>
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input section */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <ExampleSection
                            title="Should Match"
                            examples={trueExamples}
                            onChange={setTrueExamples}
                            placeholder="Enter text that should match..."
                            variant="true"
                        />
                        <ExampleSection
                            title="Should NOT Match"
                            examples={falseExamples}
                            onChange={setFalseExamples}
                            placeholder="Enter text that should not match..."
                            variant="false"
                        />
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="group relative flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                            <Wand2 className="w-4 h-4"/>
                            Generate Regex Patterns
                            {canGenerate && (
                                <span
                                    className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"/>
                            )}
                        </button>
                        {(trueExamples.length > 0 || falseExamples.length > 0) && (
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white/80 hover:border-white/20 transition-all text-sm"
                            >
                                <Trash2 className="w-4 h-4"/>
                                Clear
                            </button>
                        )}
                    </div>

                    {!canGenerate && (trueExamples.length > 0 || falseExamples.length > 0) && (
                        <div className="text-center text-sm text-white/40 mb-8">
                            {trueExamples.length === 0 && falseExamples.length > 0 && 'Add at least one example that SHOULD match'}
                            {falseExamples.length === 0 && trueExamples.length > 0 && 'Add at least one example that should NOT match'}
                        </div>
                    )}

                    {/* Results */}
                    {hasGenerated && (
                        <div style={{animation: 'fadeIn 0.4s ease-out'}}>
                            {results.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold">
                                                {results.length} Pattern{results.length !== 1 ? 's' : ''} Generated
                                            </h3>
                                            {stats && (
                                                <p className="text-sm text-white/40 mt-0.5">
                                                    Across {stats.categories} categor{stats.categories !== 1 ? 'ies' : 'y'} ·
                                                    sorted by specificity
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {results.map((result, i) => (
                                            <RegexCard key={result.id} result={result} index={i}/>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <div
                                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
                                        <Regex className="w-8 h-8 text-white/30"/>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white/70 mb-2">No patterns found</h3>
                                    <p className="text-sm text-white/40 max-w-md mx-auto">
                                        The generator couldn't find a regex that matches all your positive examples
                                        while rejecting all your negative ones. Try adjusting your examples — the
                                        positive and negative sets may be too similar or contradictory.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {!hasGenerated && !activePreset && trueExamples.length === 0 && falseExamples.length === 0 && (
                        <div className="text-center py-16" style={{animation: 'fadeIn 0.6s ease-out'}}>
                            <div
                                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-white/10 mb-5">
                                <Wand2 className="w-10 h-10 text-cyan-400/50"/>
                            </div>
                            <h3 className="text-lg font-semibold text-white/60 mb-2">Ready to generate</h3>
                            <p className="text-sm text-white/40 max-w-md mx-auto">
                                Add examples above or pick a quick example to see the generator in action.
                                Each pattern comes with an explanation of what it does.
                            </p>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-white/5 py-6">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <p className="text-xs text-white/30">
                            Regex Playground · Pure algorithmic generation, no AI · Patterns verified against your
                            examples
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default App;
