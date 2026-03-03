import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const logoModule = require('../../assets/images/Commonwealthlogo.png');
const barcodeModule = require('../../assets/images/barcode.png');

let cachedLogoBase64: string | null = null;
let cachedBarcodeBase64: string | null = null;

async function assetToBase64(mod: number): Promise<string> {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();

  if (Platform.OS === 'web') {
    return asset.uri ?? asset.localUri ?? '';
  }

  const localUri = asset.localUri ?? asset.uri;
  if (!localUri) return '';

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64' as FileSystem.EncodingType,
  });
  return `data:image/png;base64,${base64}`;
}

export async function getLogoDataUri(): Promise<string> {
  if (cachedLogoBase64) return cachedLogoBase64;
  console.log('[AssetLoader] Loading CBA logo...');
  cachedLogoBase64 = await assetToBase64(logoModule);
  console.log('[AssetLoader] Logo loaded, length:', cachedLogoBase64.length);
  return cachedLogoBase64;
}

export async function getBarcodeDataUri(): Promise<string> {
  if (cachedBarcodeBase64) return cachedBarcodeBase64;
  console.log('[AssetLoader] Loading barcode...');
  cachedBarcodeBase64 = await assetToBase64(barcodeModule);
  console.log('[AssetLoader] Barcode loaded, length:', cachedBarcodeBase64.length);
  return cachedBarcodeBase64;
}

export async function loadStatementAssets(): Promise<{ logoUri: string; barcodeUri: string }> {
  const [logoUri, barcodeUri] = await Promise.all([
    getLogoDataUri(),
    getBarcodeDataUri(),
  ]);
  return { logoUri, barcodeUri };
}
