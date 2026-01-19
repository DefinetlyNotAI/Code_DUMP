"use client";

import React from "react";

type Props = {
    selectedCount: number;
    totalCount: number;
    id?: string;
};

export default function DownloadToolbar({selectedCount, totalCount, id}: Props) {
    return (
        <div id={id} className="flex items-center justify-between gap-4 mb-4" data-role="download-toolbar">
            <div className="text-sm text-muted-foreground">
                {selectedCount > 0 ? `${selectedCount} selected` : `${totalCount} visible`}
            </div>

            <div className="flex gap-2">
                <button data-action="download-selected" className="btn btn-outline btn-sm"
                        disabled={selectedCount === 0}>
                    Download Selected
                </button>
                <button data-action="download-all" className="btn btn-primary btn-sm">
                    Download All
                </button>
            </div>
        </div>
    );
}
