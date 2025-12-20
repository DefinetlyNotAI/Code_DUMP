/**
 * IMAP service layer
 *
 * Security considerations:
 * - All IMAP operations are server-side only
 * - Never exposes credentials or raw IMAP data to client
 * - Sanitizes HTML content before sending to client
 * - Implements pagination to prevent memory exhaustion
 * - All errors logged without sensitive details
 */

import Imap from "imap"
import {simpleParser} from "mailparser"
import {getAccountById} from "./imap-config"
import DOMPurify from "isomorphic-dompurify"

export interface EmailFolder {
    name: string
    path: string
    specialUse?: string
    delimiter: string
}

export interface EmailSummary {
    uid: number
    messageId?: string
    subject?: string
    from?: Array<{ name?: string; address?: string }>
    to?: Array<{ name?: string; address?: string }>
    date?: Date
    flags: string[]
    hasAttachments: boolean
}

export interface EmailDetail extends EmailSummary {
    html?: string
    text?: string
    cc?: Array<{ name?: string; address?: string }>
    bcc?: Array<{ name?: string; address?: string }>
    attachments: Array<{
        filename?: string
        contentType?: string
        size?: number
    }>
}

/**
 * Create IMAP connection
 * Never logs credentials
 */
function createImapConnection(accountId: string): Promise<Imap> {
    return new Promise((resolve, reject) => {
        console.log("[IMAP] Creating connection for account:", accountId)

        const account = getAccountById(accountId)

        if (!account) {
            console.error("[IMAP] Account not found:", accountId)
            reject(new Error("Account not found"))
            return
        }

        console.log(
            "[IMAP] Account found. Connecting to:",
            account.imap.host,
            "port:",
            account.imap.port,
            "user:",
            account.imap.user,
        )

        if (account.imap.user.includes("your-email") || account.imap.password.includes("your-")) {
            console.error(
                "[IMAP] ERROR: Placeholder credentials detected! Please update IMAP_CONFIG environment variable with real credentials.",
            )
            reject(new Error("Invalid credentials: Please update IMAP_CONFIG environment variable with your actual email and password"))
            return
        }

        const imap = new Imap({
            user: account.imap.user,
            password: account.imap.password,
            host: account.imap.host,
            port: account.imap.port,
            tls: account.imap.secure,
            tlsOptions: {rejectUnauthorized: true},
            // Connection timeout
            connTimeout: 30000,
            authTimeout: 10000,
        })

        imap.once("ready", () => {
            console.log(`[IMAP] Connection ready for account: ${accountId}`)
            resolve(imap)
        })

        imap.once("error", (err) => {
            console.error(`[IMAP] Connection error for account: ${accountId}`, {
                error: err.message,
                host: account.imap.host,
                port: account.imap.port,
                user: account.imap.user,
            })
            console.error("[IMAP] Full error:", err)
            if (err.message.includes("Invalid credentials") || err.message.includes("authentication")) {
                reject(
                    new Error(
                        `Authentication failed for ${account.imap.user}. Please check your credentials in IMAP_CONFIG environment variable`,
                    ),
                )
            } else {
                reject(new Error(`IMAP connection failed: ${err.message}`))
            }
        })

        console.log("[IMAP] Initiating connection...")
        imap.connect()
    })
}

/**
 * List all folders in an account
 */
export async function listFolders(accountId: string): Promise<EmailFolder[]> {
    return new Promise(async (resolve, reject) => {
        let imap: Imap | null = null

        try {
            imap = await createImapConnection(accountId)

            imap.getBoxes((err, boxes) => {
                if (err) {
                    reject(err)
                    return
                }

                const folders: EmailFolder[] = []

                function parseBoxes(boxObj: any, prefix = "") {
                    for (const [name, box] of Object.entries(boxObj)) {
                        const boxData = box as any
                        const fullPath = prefix ? `${prefix}${boxData.delimiter}${name}` : name

                        folders.push({
                            name,
                            path: fullPath,
                            specialUse: boxData.special_use_attrib,
                            delimiter: boxData.delimiter,
                        })

                        if (boxData.children) {
                            parseBoxes(boxData.children, fullPath)
                        }
                    }
                }

                parseBoxes(boxes)
                resolve(folders)
            })
        } catch (error) {
            reject(error)
        } finally {
            imap?.end()
        }
    })
}

/**
 * List emails in a folder with pagination
 * Returns emails in reverse chronological order (newest first)
 */
export async function listEmails(
    accountId: string,
    folderPath: string,
    options: { limit?: number; offset?: number } = {},
): Promise<{ emails: EmailSummary[]; total: number }> {
    return new Promise(async (resolve, reject) => {
        let imap: Imap | null = null

        try {
            imap = await createImapConnection(accountId)

            imap.openBox(folderPath, true, (err, box) => {
                if (err) {
                    reject(err)
                    return
                }

                const total = box.messages.total

                if (total === 0) {
                    resolve({emails: [], total: 0})
                    return
                }

                const limit = options.limit || 50
                const offset = options.offset || 0

                // Calculate range (newest first)
                const end = Math.max(1, total - offset)
                const start = Math.max(1, end - limit + 1)

                const fetchRange = `${start}:${end}`
                const fetch = imap!.seq.fetch(fetchRange, {
                    bodies: "HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE MESSAGE-ID)",
                    struct: true,
                })

                const emails: EmailSummary[] = []

                fetch.on("message", (msg) => {
                    let uid = 0
                    let flags: string[] = []
                    let hasAttachments = false

                    msg.on("attributes", (attrs) => {
                        uid = attrs.uid
                        flags = attrs.flags
                        // Check for attachments in structure
                        if (attrs.struct) {
                            hasAttachments = checkForAttachments(attrs.struct)
                        }
                    })

                    msg.on("body", (stream) => {
                        simpleParser(stream, (err, parsed) => {
                            if (err) {
                                console.error("[IMAP] Failed to parse email", {error: err.message})
                                return
                            }

                            emails.push({
                                uid,
                                messageId: parsed.messageId,
                                subject: parsed.subject,
                                from: parsed.from?.value || [],
                                to: parsed.to?.value || [],
                                date: parsed.date,
                                flags,
                                hasAttachments,
                            })
                        })
                    })
                })

                fetch.once("error", (err) => {
                    reject(err)
                })

                fetch.once("end", () => {
                    // Sort by UID descending (newest first)
                    emails.sort((a, b) => b.uid - a.uid)
                    resolve({emails, total})
                })
            })
        } catch (error) {
            reject(error)
        } finally {
            if (imap) {
                setTimeout(() => imap?.end(), 1000)
            }
        }
    })
}

/**
 * Get full email details including body
 */
export async function getEmail(accountId: string, folderPath: string, uid: number): Promise<EmailDetail | null> {
    return new Promise(async (resolve, reject) => {
        let imap: Imap | null = null

        try {
            imap = await createImapConnection(accountId)

            imap.openBox(folderPath, true, (err) => {
                if (err) {
                    reject(err)
                    return
                }

                const fetch = imap!.fetch([uid], {
                    bodies: "",
                    struct: true,
                })

                let emailData: EmailDetail | null = null

                fetch.on("message", (msg) => {
                    let flags: string[] = []
                    let hasAttachments = false

                    msg.on("attributes", (attrs) => {
                        flags = attrs.flags
                        if (attrs.struct) {
                            hasAttachments = checkForAttachments(attrs.struct)
                        }
                    })

                    msg.on("body", (stream) => {
                        simpleParser(stream, (err, parsed) => {
                            if (err) {
                                console.error("[IMAP] Failed to parse email body", {error: err.message})
                                reject(err)
                                return
                            }

                            // Sanitize HTML to prevent XSS
                            const sanitizedHtml = parsed.html
                                ? DOMPurify.sanitize(parsed.html, {
                                    ALLOWED_TAGS: [
                                        "p",
                                        "br",
                                        "strong",
                                        "em",
                                        "u",
                                        "a",
                                        "ul",
                                        "ol",
                                        "li",
                                        "h1",
                                        "h2",
                                        "h3",
                                        "blockquote",
                                        "pre",
                                        "code",
                                        "table",
                                        "tr",
                                        "td",
                                        "th",
                                    ],
                                })
                                : undefined

                            emailData = {
                                uid,
                                messageId: parsed.messageId,
                                subject: parsed.subject,
                                from: parsed.from?.value || [],
                                to: parsed.to?.value || [],
                                cc: parsed.cc?.value || [],
                                bcc: parsed.bcc?.value || [],
                                date: parsed.date,
                                flags,
                                hasAttachments,
                                html: sanitizedHtml,
                                text: parsed.text,
                                attachments:
                                    parsed.attachments?.map((att) => ({
                                        filename: att.filename,
                                        contentType: att.contentType,
                                        size: att.size,
                                    })) || [],
                            }
                        })
                    })
                })

                fetch.once("error", (err) => {
                    reject(err)
                })

                fetch.once("end", () => {
                    resolve(emailData)
                })
            })
        } catch (error) {
            reject(error)
        } finally {
            if (imap) {
                setTimeout(() => imap?.end(), 1000)
            }
        }
    })
}

/**
 * Check if email structure contains attachments
 */
function checkForAttachments(struct: any[]): boolean {
    for (const part of struct) {
        if (Array.isArray(part)) {
            if (checkForAttachments(part)) {
                return true
            }
        } else if (part.disposition && (part.disposition.type === "attachment" || part.disposition.type === "inline")) {
            return true
        } else if (part.type && part.type.toLowerCase() !== "text" && part.type.toLowerCase() !== "multipart") {
            return true
        }
    }
    return false
}
