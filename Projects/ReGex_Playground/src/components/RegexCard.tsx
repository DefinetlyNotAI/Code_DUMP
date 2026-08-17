import {useState} from 'react';
import {Check, ChevronDown, Code2, Copy, Terminal} from 'lucide-react';
import type {RegexResult} from '@/types';
import {testAgainstInput} from '@/lib/regexGenerator';

interface RegexCardProps {
    result: RegexResult;
    index: number;
}

const categoryColors: Record<string, string> = {
    'literal': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    'character-class': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    'anchor': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'quantifier': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    'group': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    'alternation': 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    'wildcard': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    'combined': 'bg-orange-500/15 text-orange-300 border-orange-500/30',
};

export function RegexCard({result, index}: RegexCardProps) {
    const [copied, setCopied] = useState(false);
    const [testOpen, setTestOpen] = useState(false);
    const [testText, setTestText] = useState('');

    const fullRegex = `/${result.pattern}/${result.flags}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(result.pattern).catch((err) => {
            console.log(err)
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const colorClass = categoryColors[result.category] || categoryColors['combined'];
    const testResult = testText ? testAgainstInput(result.pattern, result.flags, testText) : null;

    return (
        <div
            className="group relative rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm transition-all duration-300 overflow-hidden"
            style={{animation: `slideIn 0.4s ease-out ${index * 60}ms both`}}
        >
            <div
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"/>

            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
            <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${colorClass}`}>
              {result.category.replace('-', ' ')}
            </span>
                        <span className="text-[10px] font-medium text-white/30">
              specificity {result.specificity}
            </span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/80 transition-colors"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

                <h3 className="text-base font-semibold text-white mb-1">{result.title}</h3>

                <div
                    className="relative my-3 rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-white/30 flex-shrink-0"/>
                        <code className="text-sm font-mono text-cyan-300 whitespace-pre">
                            {fullRegex}
                        </code>
                    </div>
                </div>

                <p className="text-sm text-white/60 leading-relaxed">{result.description}</p>

                {/* Inline test panel */}
                <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
                    <button
                        onClick={() => setTestOpen(!testOpen)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5"
                    >
                        <Terminal className="w-3.5 h-3.5 text-white/40"/>
                        <span className="text-xs font-medium text-white/60">Test live</span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-white/40 ml-auto transition-transform ${testOpen ? 'rotate-180' : ''}`}/>
                    </button>

                    {testOpen && (
                        <div className="px-3 pb-3 space-y-2" style={{animation: 'slideIn 0.2s ease-out'}}>
                            <input
                                type="text"
                                value={testText}
                                onChange={(e) => setTestText(e.target.value)}
                                placeholder="Type text to test..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
                            />

                            {testResult && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-2 h-2 rounded-full ${testResult.matched ? 'bg-emerald-400' : 'bg-rose-400'}`}/>
                                    <span className="text-xs font-medium text-white/70">
                    {testResult.matched ? 'Match' : 'No match'}
                  </span>
                                    {testResult.matches.length > 0 && (
                                        <span className="text-xs text-white/40">
                      {testResult.matches.length} match{testResult.matches.length !== 1 ? 'es' : ''}
                    </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
