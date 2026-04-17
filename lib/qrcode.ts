import QRCode from 'qrcode'

export async function makeQR(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#0F172A', light: '#FFFFFF' },
  })
}
