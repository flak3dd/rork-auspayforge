const CREATORS = [
  'Xero Payroll',
  'MYOB AccountRight',
  'MYOB Essentials',
  'Employment Hero Payroll',
  'KeyPay',
  'SAP SuccessFactors',
];

export interface DocumentMetadata {
  document_id: string;
  created_at: string;
  modified_at: string;
  issued_at: string;
  creator: string;
}

function generateDocumentId(): string {
  const chars = 'abcdef0123456789';
  const segments = [8, 4, 4, 4, 12];
  return segments
    .map(len =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-');
}

function randomCreator(): string {
  return CREATORS[Math.floor(Math.random() * CREATORS.length)];
}

function formatISO(date: Date): string {
  return date.toISOString();
}

export function generateMetadata(issuedDate?: Date): DocumentMetadata {
  const now = new Date();
  const issued = issuedDate ?? now;
  const created = new Date(issued.getTime() - Math.floor(Math.random() * 300000 + 60000));
  const modified = new Date(created.getTime() + Math.floor(Math.random() * 120000 + 5000));

  return {
    document_id: generateDocumentId(),
    created_at: formatISO(created),
    modified_at: formatISO(modified),
    issued_at: formatISO(issued),
    creator: randomCreator(),
  };
}

export function injectMetadataIntoHTML(html: string, enabled: boolean): string {
  if (!enabled) return html;

  const meta = generateMetadata();
  console.log('[Metadata] Injecting metadata:', JSON.stringify(meta));

  const metaTags = `
    <meta name="document-id" content="${meta.document_id}" />
    <meta name="created-at" content="${meta.created_at}" />
    <meta name="modified-at" content="${meta.modified_at}" />
    <meta name="issued-at" content="${meta.issued_at}" />
    <meta name="creator" content="${meta.creator}" />
    <meta name="generator" content="${meta.creator}" />
    <meta name="producer" content="${meta.creator}" />
    <meta name="author" content="${meta.creator}" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />`;

  const pdfMetaScript = `
    <script>
      if (typeof document !== 'undefined') {
        document.title = '${meta.creator} - Document';
      }
    <\/script>`;

  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${metaTags}${pdfMetaScript}`);
  } else if (html.includes('<head ')) {
    return html.replace(/<head([^>]*)>/, `<head$1>${metaTags}${pdfMetaScript}`);
  } else if (html.includes('<html>') || html.includes('<html ')) {
    return html.replace(/<html([^>]*)>/, `<html$1><head>${metaTags}${pdfMetaScript}</head>`);
  }

  return `<!DOCTYPE html><html><head>${metaTags}${pdfMetaScript}</head><body>${html}</body></html>`;
}
