declare module 'mailparser' {
    interface AddressObject {
        value: Array<{ name?: string; address?: string }>
        html: string
        text: string
    }

    interface ParsedMail {
        messageId?: string
        subject?: string
        from?: AddressObject
        to?: AddressObject
        cc?: AddressObject
        bcc?: AddressObject
        date?: Date
        html?: string
        text?: string
        attachments?: Array<{
            filename?: string
            contentType?: string
            size?: number
            content?: Buffer
        }>
    }

    export function simpleParser(
        stream: NodeJS.ReadableStream,
        callback: (err: Error | null, parsed: ParsedMail) => void
    ): void
}

