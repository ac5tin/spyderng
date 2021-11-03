export interface Results {
    rawHTML: string,
    url: string,
    title: string,
    summary: string,
    mainContent: string,
    author: string,
    timestamp: string,
    site: string,
    country: string,
    lang: string,
    type: string,
    relatedInternalLinks: string[],
    relatedExternalLinks: string[],
    tokens: string[],
}
