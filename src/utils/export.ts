import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { documentDirectory, copyAsync } from 'expo-file-system';
import { injectMetadataIntoHTML } from '@/utils/metadata';

async function generatePDFUri(html: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });
  return uri;
}

function webDownloadPDF(html: string, filename: string): void {
  console.log('[Export] Web platform — triggering download via print dialog');
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${filename}</title></head><body>
      ${html}
      <script>window.onload=function(){document.title='${filename}.pdf';window.print();}<\/script>
      </body></html>
    `);
    printWindow.document.close();
  } else {
    Alert.alert('Export Failed', 'Unable to open print window. Please allow popups.');
  }
}

export async function saveAsPDF(html: string, filename: string, metadataClean: boolean = false): Promise<void> {
  console.log('[Export] Save as PDF for:', filename, '| metadata:', metadataClean);
  html = injectMetadataIntoHTML(html, metadataClean);

  if (Platform.OS === 'web') {
    webDownloadPDF(html, filename);
    return;
  }

  try {
    const uri = await generatePDFUri(html);
    console.log('[Export] PDF generated at:', uri);

    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docDir = documentDirectory;
    if (!docDir) {
      console.error('[Export] Document directory not available');
      Alert.alert('Save Error', 'Document directory is not available.');
      return;
    }
    const destUri = `${docDir}${safeName}.pdf`;

    await copyAsync({ from: uri, to: destUri });
    console.log('[Export] PDF saved to documents:', destUri);

    Alert.alert(
      'PDF Saved',
      `${safeName}.pdf has been saved to your documents.`,
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Share',
          onPress: async () => {
            try {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(destUri, {
                  UTI: '.pdf',
                  mimeType: 'application/pdf',
                  dialogTitle: `Share ${safeName}.pdf`,
                });
              }
            } catch (e: any) {
              if (!e?.message?.includes('cancel')) {
                console.error('[Export] Share error:', e);
              }
            }
          },
        },
      ]
    );
  } catch (error: any) {
    console.error('[Export] Save as PDF error:', error);
    Alert.alert('Save Error', 'Failed to save PDF. Please try again.');
  }
}

export async function exportHTMLToPDF(html: string, filename: string, metadataClean: boolean = false): Promise<void> {
  console.log('[Export] Starting export for:', filename, '| metadata:', metadataClean);
  html = injectMetadataIntoHTML(html, metadataClean);

  if (Platform.OS === 'web') {
    webDownloadPDF(html, filename);
    return;
  }

  try {
    const uri = await generatePDFUri(html);
    console.log('[Export] PDF saved to:', uri);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Save ${filename}`,
      });
      console.log('[Export] Share dialog opened');
    } else {
      Alert.alert('PDF Saved', `File saved to:\n${uri}`);
    }
  } catch (error: any) {
    console.error('[Export] Error:', error);
    if (error?.message?.includes('cancel') || error?.code === 'ERR_SHARING_CANCELLED') {
      return;
    }
    Alert.alert('Export Error', 'Failed to generate PDF. Please try again.');
  }
}

export async function saveAllAsPDF(htmls: string[], filename: string, metadataClean: boolean = false): Promise<void> {
  console.log('[Export] Save all as PDF, count:', htmls.length);
  if (htmls.length === 0) return;

  const combinedHTML = buildCombinedHTML(htmls);
  await saveAsPDF(combinedHTML, filename, metadataClean);
}

function buildCombinedHTML(htmls: string[]): string {
  if (htmls.length === 1) return htmls[0];
  return `
<!DOCTYPE html>
<html>
<head>
<style>
@page { margin: 0; }
.page-break { page-break-before: always; }
</style>
</head>
<body>
${htmls.map((h, i) => {
    const bodyMatch = h.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = bodyMatch ? bodyMatch[1] : h;
    const styleMatch = h.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styles = styleMatch ? `<style>${styleMatch[1]}</style>` : '';
    return `${i > 0 ? '<div class="page-break"></div>' : ''}${styles}${content}`;
  }).join('\n')}
</body>
</html>`;
}

export async function exportBatchPDF(payslipHTMLs: string[], statementHTML: string, filename: string, metadataClean: boolean = false): Promise<void> {
  console.log('[Export] Batch export - payslips:', payslipHTMLs.length, '+ statement');
  const allHTMLs = [...payslipHTMLs];
  if (statementHTML) {
    allHTMLs.push(statementHTML);
  }
  if (allHTMLs.length === 0) return;

  if (Platform.OS === 'web') {
    const combined = allHTMLs.join('<div style="page-break-before: always;"></div>');
    const wrappedHTML = `<!DOCTYPE html><html><head><style>@page{margin:0;}</style></head><body>${combined}</body></html>`;
    await exportHTMLToPDF(wrappedHTML, filename, metadataClean);
    return;
  }

  const combinedHTML = `
<!DOCTYPE html>
<html>
<head>
<style>
@page { margin: 0; }
.page-break { page-break-before: always; }
</style>
</head>
<body>
${allHTMLs.map((h, i) => {
    const bodyMatch = h.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = bodyMatch ? bodyMatch[1] : h;
    const styleMatch = h.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styles = styleMatch ? `<style>${styleMatch[1]}</style>` : '';
    return `${i > 0 ? '<div class="page-break"></div>' : ''}${styles}${content}`;
  }).join('\n')}
</body>
</html>`;

  await exportHTMLToPDF(combinedHTML, filename, metadataClean);
}

export async function exportAllPayslips(htmls: string[], baseFilename: string, metadataClean: boolean = false): Promise<void> {
  console.log('[Export] Exporting all payslips, count:', htmls.length);

  if (Platform.OS === 'web') {
    const combined = htmls.join('<div style="page-break-before: always;"></div>');
    const wrappedHTML = `<!DOCTYPE html><html><head><style>@page{margin:0;}</style></head><body>${combined}</body></html>`;
    await exportHTMLToPDF(wrappedHTML, baseFilename, metadataClean);
    return;
  }

  if (htmls.length === 1) {
    await exportHTMLToPDF(htmls[0], baseFilename, metadataClean);
    return;
  }

  const combinedHTML = `
<!DOCTYPE html>
<html>
<head>
<style>
@page { margin: 0; }
.page-break { page-break-before: always; }
</style>
</head>
<body>
${htmls.map((h, i) => {
    const bodyMatch = h.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = bodyMatch ? bodyMatch[1] : h;
    const styleMatch = h.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styles = styleMatch ? `<style>${styleMatch[1]}</style>` : '';
    return `${i > 0 ? '<div class="page-break"></div>' : ''}${styles}${content}`;
  }).join('\n')}
</body>
</html>`;

  await exportHTMLToPDF(combinedHTML, baseFilename, metadataClean);
}
