/**
 * Text Formatter for Plain Text Emails
 * Converts markdown-style formatting and auto-links URLs and emails
 */

import {TextFormattingSettings} from './settings'

/**
 * Format plain text email with markdown-style formatting
 * Supports:
 * - URLs: http://example.com -> <a href="...">
 * - Emails: user@example.com or user@example.com<mailto:user@example.com> -> <a href="mailto:...">
 * - Bold: *text* or **text** -> <strong>
 * - Italic: _text_ -> <em>
 * - Underline: __text__ -> <u>
 * - Strikethrough: ~~text~~ -> <s>
 * - Code: `code` -> <code>
 * - Line breaks preserved
 */
export function formatPlainText(text: string): string {
    if (!text) return ''

    let formatted = text

    // FIRST: Preprocess special email formats BEFORE HTML escaping
    if (TextFormattingSettings.autoLinkEmails) {
        formatted = preprocessEmailAddresses(formatted)
    }

    // THEN: Escape HTML to prevent XSS
    formatted = escapeHtml(formatted)

    // Apply formatting if enabled
    if (TextFormattingSettings.enableMarkdownFormatting) {
        // 1. Code blocks first (to prevent processing their content)
        if (TextFormattingSettings.supportCode) {
            formatted = formatCode(formatted)
        }

        // 2. URLs (before email to avoid conflicts)
        if (TextFormattingSettings.autoLinkUrls) {
            formatted = formatUrls(formatted)
        }

        // 3. Email addresses
        if (TextFormattingSettings.autoLinkEmails) {
            formatted = formatEmailAddresses(formatted)
        }

        // 4. Bold (before italic to handle ** correctly)
        if (TextFormattingSettings.supportBold) {
            formatted = formatBold(formatted)
        }

        // 5. Italic
        if (TextFormattingSettings.supportItalic) {
            formatted = formatItalic(formatted)
        }

        // 6. Underline
        if (TextFormattingSettings.supportUnderline) {
            formatted = formatUnderline(formatted)
        }

        // 7. Strikethrough
        if (TextFormattingSettings.supportStrikethrough) {
            formatted = formatStrikethrough(formatted)
        }
    }

    // 8. Preserve line breaks
    if (TextFormattingSettings.preserveLineBreaks) {
        formatted = formatted.replace(/\n/g, '<br>')
    }

    // 9. Preserve multiple spaces
    if (TextFormattingSettings.preserveSpaces) {
        formatted = formatted.replace(/ {2}/g, ' &nbsp;')
    }

    return formatted
}

/**
 * Preprocess email addresses to remove <mailto:...> tags
 * This must be done BEFORE HTML escaping
 */
function preprocessEmailAddresses(text: string): string {
    // Handle format: email<mailto:email> - remove the <mailto:...> part
    text = text.replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})<mailto:[^>]+>/gi,
        '$1'
    )

    // Handle standalone <mailto:email> - remove the tags but keep email
    text = text.replace(
        /<mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/gi,
        '$1'
    )

    return text
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

/**
 * Format URLs as clickable links
 * Matches: http://, https://, ftp://, www.
 */
function formatUrls(text: string): string {
    // Match URLs
    const urlRegex = /(?:(?:https?|ftp):\/\/|www\.)[^\s<]+[^\s<.,;:!?'")\]}/]/gi

    return text.replace(urlRegex, (url) => {
        let href = url

        // Add protocol if missing
        if (url.startsWith('www.')) {
            href = 'http://' + url
        }

        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${url}</a>`
    })
}

/**
 * Format email addresses as mailto links
 * Note: Special formats like email<mailto:email> are already preprocessed
 */
function formatEmailAddresses(text: string): string {
    // Match plain email addresses (not already in links)
    text = text.replace(
        /(?<!href="|>)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![^<]*<\/a>)/gi,
        '<a href="mailto:$1" class="text-primary hover:underline">$1</a>'
    )

    return text
}

/**
 * Format bold text: *text* or **text**
 */
function formatBold(text: string): string {
    // Match **text** (double asterisk)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

    // Match *text* (single asterisk, not already processed)
    // Negative lookbehind/lookahead to avoid matching already processed
    text = text.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<strong>$1</strong>')

    return text
}

/**
 * Format italic text: _text_
 */
function formatItalic(text: string): string {
    // Match _text_ (underscore)
    // Avoid matching in URLs or already processed
    text = text.replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>')

    return text
}

/**
 * Format underline text: __text__
 */
function formatUnderline(text: string): string {
    // Match __text__ (double underscore)
    text = text.replace(/__([^_]+)__/g, '<u>$1</u>')

    return text
}

/**
 * Format strikethrough text: ~~text~~
 */
function formatStrikethrough(text: string): string {
    // Match ~~text~~ (double tilde)
    text = text.replace(/~~([^~]+)~~/g, '<s>$1</s>')

    return text
}

/**
 * Format code: `code` or ```code```
 */
function formatCode(text: string): string {
    // Match ```code``` (triple backtick - code blocks)
    text = text.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')

    // Match `code` (single backtick - inline code)
    text = text.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')

    return text
}

/**
 * Remove all formatting (get plain text)
 * @public - Utility function for future use
 */
// @ts-ignore - Utility function for future use
export function stripFormatting(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
}

/**
 * Preview formatted text (for testing)
 * @public - Utility function for future use
 */
// @ts-ignore - Utility function for future use
export function previewFormatting(text: string, maxLength: number = 100): string {
    const formatted = formatPlainText(text)
    const plain = stripFormatting(formatted)

    if (plain.length > maxLength) {
        return plain.substring(0, maxLength) + '...'
    }

    return plain
}

/**
 * Count formatting elements in text
 * @public - Utility function for future use
 */
// @ts-ignore - Utility function for future use
export function countFormattingElements(text: string): {
    urls: number
    emails: number
    bold: number
    italic: number
    code: number
} {
    return {
        urls: (text.match(/(?:https?|ftp):\/\/[^\s<]+/gi) || []).length,
        emails: (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || []).length,
        bold: (text.match(/\*\*?[^*]+\*\*?/g) || []).length,
        italic: (text.match(/_[^_]+_/g) || []).length,
        code: (text.match(/`[^`]+`/g) || []).length,
    }
}

/**
 * Check if text contains any formatting
 * @public - Utility function for future use
 */
// @ts-ignore - Utility function for future use
export function hasFormatting(text: string): boolean {
    const counts = countFormattingElements(text)
    return Object.values(counts).some(count => count > 0)
}

/**
 * Format text for display in email viewer
 * @public - Utility function for future use
 */
// @ts-ignore - Utility function for future use
export function formatEmailText(text: string | undefined, isHtml: boolean = false): string {
    if (!text) return ''

    if (isHtml) {
        // HTML is already formatted, just return it
        return text
    }

    // Plain text - apply formatting
    return formatPlainText(text)
}

