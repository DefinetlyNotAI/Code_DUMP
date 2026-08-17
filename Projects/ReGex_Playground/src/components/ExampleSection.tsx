import * as React from 'react';
import {useState} from 'react';
import {CheckCircle2, Plus, X, XCircle} from 'lucide-react';

interface ExampleSectionProps {
    title: string;
    examples: string[];
    onChange: (examples: string[]) => void;
    placeholder: string;
    variant: 'true' | 'false';
}

export function ExampleSection({title, examples, onChange, placeholder, variant}: ExampleSectionProps) {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        const value = input.trim();
        if (value && !examples.includes(value)) {
            onChange([...examples, value]);
            setInput('');
        }
    };

    const handleRemove = (index: number) => {
        onChange(examples.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const Icon = variant === 'true' ? CheckCircle2 : XCircle;

    return (
        <div className={`rounded-2xl border bg-white/5 backdrop-blur-sm transition-colors ${
            variant === 'true' ? 'border-emerald-500/30' : 'border-rose-500/30'
        }`}>
            <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                <Icon className={`w-5 h-5 ${variant === 'true' ? 'text-emerald-400' : 'text-rose-400'}`}/>
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase">{title}</h3>
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    variant === 'true' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                }`}>
          {examples.length}
        </span>
            </div>

            <div className="px-5 pb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={`flex-1 bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors ${
                            variant === 'true'
                                ? 'border-emerald-500/20 focus:border-emerald-400/50'
                                : 'border-rose-500/20 focus:border-rose-400/50'
                        }`}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!input.trim()}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            variant === 'true'
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        }`}
                    >
                        <Plus className="w-4 h-4"/>
                        Add
                    </button>
                </div>

                <div className="mt-3 space-y-1.5">
                    {examples.length === 0 && (
                        <p className="text-xs text-white/30 italic py-2">No examples yet — add at least one.</p>
                    )}
                    {examples.map((ex, i) => (
                        <div
                            key={i}
                            className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                variant === 'true' ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-rose-500/5 hover:bg-rose-500/10'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${variant === 'true' ? 'bg-emerald-400' : 'bg-rose-400'}`}/>
                            <span className="flex-1 text-white/80 font-mono break-all">{ex}</span>
                            <button
                                onClick={() => handleRemove(i)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white/80"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
