/**
 * IMAP service layer
 *
 * Security considerations:
 * - All IMAP operations are server-side only
 * - Never exposes credentials or raw IMAP data to client
 * - Sanitizes HTML content before sending to client
 * - Implements pagination to prevent memory exhaustion
 * - All errors logged without sensitive details
 * - Serverless-compatible: Creates fresh connections for each request
 */

import Imap from "imap"
import {simpleParser} from "mailparser"
import {getAccountById} from "./imap-config"
import DOMPurify from "isomorphic-dompurify"
import {EmailDetail, EmailFolder} from "@/types";

/**
 * Create IMAP connection
 * Serverless-compatible: No connection pooling
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
 * Close IMAP connection
 * Serverless-compatible: Always close connections after use
 */
function closeConnection(imap: Imap) {
    try {
        imap.end()
    } catch (error) {
        console.error("[IMAP] Error closing connection:", error)
    }
}

/**
 * List all folders in an account with unread counts
 * Optimized: Only fetches counts for common folders to improve speed
 */
export async function listFolders(accountId: string): Promise<EmailFolder[]> {
    let imap: Imap | null = null

    try {
        imap = await createImapConnection(accountId)

        return await new Promise((resolve, reject) => {
            imap!.getBoxes((err, boxes) => {
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
                            unreadCount: 0, // Will be updated for important folders
                        })

                        if (boxData.children) {
                            parseBoxes(boxData.children, fullPath)
                        }
                    }
                }

                parseBoxes(boxes)

                // Only get counts for important folders to improve speed
                const importantFolderNames = ['INBOX', 'Sent', 'Drafts', 'Spam', 'Trash', 'Junk']
                const foldersToCount = folders.filter(f =>
                    importantFolderNames.some(name =>
                        f.path.toLowerCase().includes(name.toLowerCase())
                    )
                )

                if (foldersToCount.length === 0) {
                    resolve(folders)
                    return
                }

                let processedFolders = 0
                const totalToProcess = foldersToCount.length

                foldersToCount.forEach((folder) => {
                    imap!.openBox(folder.path, true, (err, box) => {
                        if (!err && box) {
                            const folderIndex = folders.findIndex(f => f.path === folder.path)
                            if (folderIndex !== -1) {
                                folders[folderIndex].unreadCount = box.messages.total || 0
                            }
                        }

                        processedFolders++

                        if (processedFolders === totalToProcess) {
                            resolve(folders)
                        }
                    })
                })
            })
        })
    } finally {
        if (imap) {
            closeConnection(imap)
        }
    }
}

/**
 * List emails in a folder with pagination
 * Returns emails in reverse chronological order (newest first)
 */
export async function listEmails(
    accountId: string,
    folderPath: string,
    options: { limit?: number; offset?: number } = {},
): Promise<{ emails: EmailDetail[]; total: number }> {
    let imap: Imap | null = null

    try {
        imap = await createImapConnection(accountId)

        return await new Promise((resolve, reject) => {
            imap!.openBox(folderPath, true, (err, box) => {
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

                const emails: EmailDetail[] = []
                let messageCount = 0
                const expectedCount = end - start + 1

                fetch.on("message", (msg) => {
                    let attributes: any = null
                    let parsed: any = null
                    let completed = false

                    const tryPush = () => {
                        if (attributes && parsed && !completed) {
                            completed = true
                            emails.push({
                                uid: attributes.uid,
                                messageId: parsed.messageId,
                                subject: parsed.subject,
                                from: parsed.from?.value || [],
                                to: parsed.to?.value || [],
                                date: parsed.date,
                                flags: attributes.flags,
                                hasAttachments: attributes.hasAttachments,
                            })
                            messageCount++
                        }
                    }

                    msg.on("attributes", (attrs) => {
                        attributes = {
                            uid: attrs.uid,
                            flags: attrs.flags,
                            hasAttachments: attrs.struct ? checkForAttachments(attrs.struct) : false
                        }
                        tryPush()
                    })

                    msg.on("body", (stream) => {
                        simpleParser(stream, (err, parsedData) => {
                            if (err) {
                                console.error("[IMAP] Failed to parse email", {error: err.message})
                                // Still count this message to avoid hanging
                                messageCount++
                                return
                            }
                            parsed = parsedData
                            tryPush()
                        })
                    })
                })

                fetch.once("error", (err) => {
                    reject(err)
                })

                fetch.once("end", () => {
                    // Wait a bit to ensure all parsing is complete
                    const checkComplete = () => {
                        if (messageCount >= expectedCount) {
                            // Sort by UID descending (newest first)
                            emails.sort((a, b) => b.uid - a.uid)
                            resolve({emails, total})
                        } else {
                            // Wait a bit more if not all messages processed
                            setTimeout(checkComplete, 100)
                        }
                    }

                    // Give a small delay to ensure all async parsing completes
                    setTimeout(checkComplete, 100)
                })
            })
        })
    } finally {
        if (imap) {
            closeConnection(imap)
        }
    }
}

/**
 * Get full email details including body
 */
export async function getEmail(accountId: string, folderPath: string, uid: number): Promise<EmailDetail | null> {
    let imap: Imap | null = null

    try {
        imap = await createImapConnection(accountId)

        return await new Promise((resolve, reject) => {
            imap!.openBox(folderPath, true, (err, box) => {
                if (err) {
                    reject(err)
                    return
                }

                console.log(`[IMAP] Fetching UID ${uid} from folder ${folderPath}, total messages: ${box.messages.total}`)

                // Use fetch (not seq.fetch) to fetch by UID
                const fetch = imap!.fetch([uid], {
                    bodies: "",
                    struct: true,
                })

                let attributes: any = null
                let parsed: any = null
                let messageFound = false

                fetch.on("message", (msg) => {
                    messageFound = true

                    const tryComplete = () => {
                        if (attributes && parsed) {
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

                            const emailData: EmailDetail = {
                                uid,
                                messageId: parsed.messageId,
                                subject: parsed.subject,
                                from: parsed.from?.value || [],
                                to: parsed.to?.value || [],
                                cc: parsed.cc?.value || [],
                                bcc: parsed.bcc?.value || [],
                                date: parsed.date,
                                flags: attributes.flags,
                                hasAttachments: attributes.hasAttachments,
                                html: sanitizedHtml,
                                text: parsed.text,
                                attachments:
                                    parsed.attachments?.map((att: any, index: number) => ({
                                        filename: att.filename,
                                        contentType: att.contentType,
                                        size: att.size,
                                        contentId: att.contentId,
                                        partId: att.partId || `${index + 1}`,
                                    })) || [],
                            }

                            resolve(emailData)
                        }
                    }

                    msg.on("attributes", (attrs) => {
                        attributes = {
                            flags: attrs.flags,
                            hasAttachments: attrs.struct ? checkForAttachments(attrs.struct) : false
                        }
                        tryComplete()
                    })

                    msg.on("body", (stream) => {
                        simpleParser(stream, (err, parsedData) => {
                            if (err) {
                                console.error("[IMAP] Failed to parse email body", {error: err.message})
                                reject(err)
                                return
                            }
                            parsed = parsedData
                            tryComplete()
                        })
                    })
                })

                fetch.once("error", (err) => {
                    console.error(`[IMAP] Error fetching email UID ${uid}:`, err.message)
                    reject(err)
                })

                fetch.once("end", () => {
                    if (!messageFound) {
                        console.log(`[IMAP] No message found for UID ${uid}`)
                        resolve(null)
                    }
                })
            })
        })
    } finally {
        if (imap) {
            closeConnection(imap)
        }
    }
}

/**
 * Get email attachment
 * Returns the decoded attachment content from the parsed email
 */
export async function getAttachment(
    accountId: string,
    folderPath: string,
    uid: number,
    partId: string
): Promise<{ content: Buffer; contentType: string } | null> {
    let imap: Imap | null = null

    try {
        imap = await createImapConnection(accountId)

        return await new Promise((resolve, reject) => {
            imap!.openBox(folderPath, true, (err) => {
                if (err) {
                    reject(err)
                    return
                }

                console.log(`[IMAP] Fetching email with attachments, UID ${uid}, partId ${partId}`)

                // Fetch the entire email and parse it to get properly decoded attachments
                const fetch = imap!.fetch([uid], {
                    bodies: "",
                    struct: true,
                })

                let messageFound = false

                fetch.on("message", (msg) => {
                    messageFound = true

                    msg.on("body", (stream) => {
                        simpleParser(stream, (err, parsed) => {
                            if (err) {
                                console.error("[IMAP] Failed to parse email for attachment", {error: err.message})
                                reject(err)
                                return
                            }

                            // Find the attachment by partId (index-based)
                            const attachments = parsed.attachments || []
                            const index = parseInt(partId, 10) - 1

                            if (index >= 0 && index < attachments.length) {
                                const attachment = attachments[index]

                                if (!attachment.content) {
                                    console.error(`[IMAP] Attachment content is empty for ${attachment.filename}`)
                                    resolve(null)
                                    return
                                }

                                const attachmentData = {
                                    content: attachment.content,
                                    contentType: attachment.contentType || 'application/octet-stream'
                                }

                                console.log(`[IMAP] Found attachment: ${attachment.filename}, size: ${attachment.size}, type: ${attachment.contentType}`)

                                resolve(attachmentData)
                            } else {
                                console.error(`[IMAP] Attachment index ${index} not found, total attachments: ${attachments.length}`)
                                resolve(null)
                            }
                        })
                    })
                })

                fetch.once("error", (err) => {
                    console.error(`[IMAP] Error fetching email for attachment:`, err.message)
                    reject(err)
                })

                fetch.once("end", () => {
                    if (!messageFound) {
                        console.log(`[IMAP] No message found for UID ${uid}`)
                        resolve(null)
                    }
                })
            })
        })
    } finally {
        if (imap) {
            closeConnection(imap)
        }
    }
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
