import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function exportHTMLToPDF(html: string, filename: string): Promise<void> {
  console.log('[Export] Starting export for:', filename);

  if (Platform.OS === 'web') {
    console.log('[Export] Web platform — opening print dialog');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      Alert.alert('Export Failed', 'Unable to open print window. Please allow popups.');
    }
    return;
  }

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      width: 612,
      height: 792,
    });
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

export async function exportAllPayslips(htmls: string[], baseFilename: string): Promise<void> {
  console.log('[Export] Exporting all payslips, count:', htmls.length);

  if (Platform.OS === 'web') {
    const combined = htmls.join('<div style="page-break-before: always;"></div>');
    const wrappedHTML = `<!DOCTYPE html><html><head><style>@page{margin:0;}</style></head><body>${combined}</body></html>`;
    await exportHTMLToPDF(wrappedHTML, baseFilename);
    return;
  }

  if (htmls.length === 1) {
    await exportHTMLToPDF(htmls[0], baseFilename);
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

  await exportHTMLToPDF(combinedHTML, baseFilename);
}
