"use client"

interface EventViewerProps {
    events: Record<string, any>
    eventStatus: Record<string, string>
    onCloseAction: () => void
    onReplayEventAction: (eventName: string) => void
}

export const EventViewer = ({events, eventStatus, onCloseAction, onReplayEventAction}: EventViewerProps) => {
    const getStatusClass = (eventName: string) => {
        const status = eventStatus[eventName] || "unseen"
        return `event-item ${status}`
    }

    return (
        <div className="event-viewer">
            <div className="event-viewer-header">
                <h2>Event Viewer</h2>
                <button className="close-button" onClick={onCloseAction}>
                    ×
                </button>
            </div>

            <div className="event-list">
                {Object.keys(events).map((eventName) => (
                    <div
                        key={eventName}
                        className={getStatusClass(eventName)}
                        onClick={() => {
                            if (eventStatus[eventName] === "completed") {
                                onReplayEventAction(eventName)
                            }
                        }}
                    >
                        <span className="event-name">{eventName}</span>
                        <span className="event-status">
              {eventStatus[eventName] === "completed" && "✓"}
                            {eventStatus[eventName] === "skipped" && "✗"}
                            {eventStatus[eventName] === "pending" && "⋯"}
                            {!eventStatus[eventName] && "○"}
            </span>
                    </div>
                ))}
            </div>

            <div className="event-viewer-legend">
                <div className="legend-item">
                    <span className="status-dot completed"></span> Completed
                </div>
                <div className="legend-item">
                    <span className="status-dot skipped"></span> Skipped
                </div>
                <div className="legend-item">
                    <span className="status-dot pending"></span> In Progress
                </div>
                <div className="legend-item">
                    <span className="status-dot unseen"></span> Unseen
                </div>
            </div>
        </div>
    )
}
