// CSRF Related Types
export interface CsrfTokenData {
    token: string
    expiresAt: number
}

// IMAP Related Types
interface ImapCredentials {
    host: string
    port: number
    secure: boolean
    user: string
    password: string
}

export interface ImapAccount {
    id: string
    label: string
    imap: ImapCredentials
}

export interface ImapConfig {
    accounts: ImapAccount[]
}

// Email Related Types (Folders, Emails, etc.)
export interface EmailAttachment {
    filename?: string
    contentType?: string
    size?: number
    contentId?: string
    partId?: string
}

export interface EmailFolder {
    name: string
    path: string
    specialUse?: string
    delimiter: string
    unreadCount?: number
}

export interface EmailAddress {
    name?: string
    address?: string
}

export interface EmailDetail {
    uid: number
    messageId?: string
    subject?: string
    from?: EmailAddress[]
    to?: EmailAddress[]
    cc?: EmailAddress[]
    bcc?: EmailAddress[]
    date?: Date
    html?: string
    text?: string
    hasAttachments: boolean
    attachments?: EmailAttachment[]
    flags: string[]
}

export interface EmailViewerProps {
    accountId: string
    folder: string
    uid: number
}

export interface FolderListProps {
    accountId: string
    selectedFolder: string | null
    onFolderSelect: (folder: string) => void
    onLoadingComplete?: () => void
}

export interface EmailListProps {
    accountId: string
    folder: string
    selectedUid?: number
    onEmailSelect: (uid: number) => void
}

export interface EmailCount {
    emails: EmailDetail[];
    total: number
}

// Other MISC Types
export interface Account {
    id: string
    label: string
}

export interface DashboardHeaderProps {
    accounts: Account[]
    selectedAccount: string | null
    onAccountChange: (accountId: string) => void
    disabled?: boolean
}

export interface CacheItem<T> {
    data: T
    timestamp: number
    ttl: number
}