"use client";

import React from "react";
import {Download, X} from "lucide-react";

type Props = {
    selectedCount: number;
    totalCount: number;
    id?: string;
    onClearSelectionAction?: () => void;
};

export default function DownloadToolbar({selectedCount, totalCount, id, onClearSelectionAction}: Props) {
    return (
        <div
            id={id}
            className="sticky top-0 z-50 flex items-center justify-between gap-2 sm:gap-4 mb-6 p-2 sm:p-4 rounded-lg border border-gray-800"
            data-role="download-toolbar"
            style={{
                background: 'linear-gradient(to right, #000000, #1a1a1a)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
            }}
        >
            <div className="text-xs sm:text-sm font-medium" style={{color: '#f8fafc'}}>
                {selectedCount > 0 ? (
                    <span>
                        <span style={{color: '#D4AF37', fontWeight: 600}}>{selectedCount}</span>
                        <span className="hidden sm:inline"> selected</span>
                    </span>
                ) : (
                    <span>
                        <span style={{color: '#7a7a7a'}}>{totalCount}</span>
                        <span className="hidden sm:inline"> photos</span>
                    </span>
                )}
            </div>

            <div className="flex gap-2 sm:gap-3">
                {selectedCount > 0 && onClearSelectionAction && (
                    <button
                        onClick={onClearSelectionAction}
                        className="px-2 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2"
                        style={{
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        title="Clear Selection"
                    >
                        <X className="w-4 h-4"/>
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                )}
                <button
                    data-action="download-selected"
                    className="px-2 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2"
                    disabled={selectedCount === 0}
                    style={{
                        background: 'transparent',
                        color: selectedCount > 0 ? '#D4AF37' : '#4a4a4a',
                        border: selectedCount > 0 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #2a2a2a',
                        cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                        opacity: selectedCount === 0 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (selectedCount > 0) {
                            e.currentTarget.style.borderColor = '#D4AF37';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedCount > 0) {
                            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }
                    }}
                    title="Download Selected"
                >
                    <Download className="w-4 h-4"/>
                    <span className="hidden sm:inline">Download</span>Selected
                </button>
                <button
                    data-action="download-all"
                    className="px-2 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2"
                    style={{
                        background: '#D4AF37',
                        color: '#000',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.25)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E5C158';
                        e.currentTarget.style.boxShadow = '0 6px 25px rgba(212, 175, 55, 0.35)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#D4AF37';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(212, 175, 55, 0.25)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    title="Download All"
                >
                    <Download className="w-4 h-4"/>
                    <span className="hidden sm:inline">Download</span>All
                </button>
            </div>
        </div>
    );
}
