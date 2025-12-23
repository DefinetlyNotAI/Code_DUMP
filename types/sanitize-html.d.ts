declare module 'sanitize-html' {
  export interface AllowedSchemesByTag {
    [tagName: string]: string[]
  }

  export interface SanitizeHtmlOptions {
    allowedTags?: string[]
    allowedAttributes?: { [tag: string]: string[] } | string[]
    allowedSchemesByTag?: AllowedSchemesByTag
    allowedSchemes?: string[]
    allowProtocolRelative?: boolean
    disallowedTagsMode?: 'discard' | 'escape'
    [key: string]: any
  }

  declare function sanitizeHtml(dirty: string, options?: SanitizeHtmlOptions): string

  export default sanitizeHtml
}

