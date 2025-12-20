declare module 'imap' {
  import { EventEmitter } from 'events'

  interface ImapConfig {
    user: string
    password: string
    host: string
    port: number
    tls: boolean
    tlsOptions?: any
    connTimeout?: number
    authTimeout?: number
  }

  interface Box {
    name: string
    messages: {
      total: number
      new: number
    }
  }

  interface ImapFetch extends EventEmitter {
    on(event: 'message', listener: (msg: ImapMessage, seqno: number) => void): this
    on(event: 'error', listener: (err: Error) => void): this
    once(event: 'end', listener: () => void): this
    once(event: 'error', listener: (err: Error) => void): this
  }

  interface ImapMessage extends EventEmitter {
    on(event: 'body', listener: (stream: NodeJS.ReadableStream, info: any) => void): this
    on(event: 'attributes', listener: (attrs: any) => void): this
  }

  class Connection extends EventEmitter {
    constructor(config: ImapConfig)
    connect(): void
    end(): void
    openBox(name: string, readOnly: boolean, callback: (err: Error | null, box: Box) => void): void
    getBoxes(callback: (err: Error | null, boxes: any) => void): void
    fetch(source: any, options: any): ImapFetch
    seq: {
      fetch(source: any, options: any): ImapFetch
    }
  }

  export = Connection
}
