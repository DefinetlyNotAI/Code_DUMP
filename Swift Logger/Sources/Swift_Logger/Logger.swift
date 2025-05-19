// The Swift Programming Language
// https://docs.swift.org/swift-book
import Foundation

public class Logger {
    public enum LogLevel: String {
        case debug = "DEBUG"
        case info = "INFO"
        case warning = "WARNING"
        case error = "ERROR"
    }

    public static let shared = Logger()

    private init() {}

    public func log(_ message: String, level: LogLevel = .info) {
        let formattedMessage = format(message, level: level)
        print(formattedMessage)
    }

    private func format(_ message: String, level: LogLevel) -> String {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .short, timeStyle: .long)
        return "[\(timestamp)] [\(level.rawValue)] \(message)"
    }
}