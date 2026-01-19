"use client";

import React from "react";
import {Download} from "lucide-react";

type Props = {
    selectedCount: number;
    totalCount: number;
    id?: string;
};

export default function DownloadToolbar({selectedCount, totalCount, id}: Props) {
    return (
        <div
            id={id}
            className="flex items-center justify-between gap-4 mb-6 p-4 rounded-lg border border-gray-800"
            data-role="download-toolbar"
            style={{
                background: 'linear-gradient(to right, #000000, #1a1a1a)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}
        >
            <div className="text-sm font-medium" style={{color: '#f8fafc'}}>
                {selectedCount > 0 ? (
                    <span>
                        <span style={{color: '#D4AF37', fontWeight: 600}}>{selectedCount}</span> selected
                    </span>
                ) : (
                    <span>
                        <span style={{color: '#7a7a7a'}}>{totalCount}</span> photos
                    </span>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    data-action="download-selected"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2"
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
                >
                    <Download className="w-4 h-4"/>
                    Download Selected
                </button>
                <button
                    data-action="download-all"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2"
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
                >
                    <Download className="w-4 h-4"/>
                    Download All
                </button>
            </div>
        </div>
    );
}
