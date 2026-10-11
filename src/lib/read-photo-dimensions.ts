/** Lee dimensiones antes de decodificar los píxeles de un JPEG/PNG local. */
export async function readPhotoDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const invalid = () => new Error("La fotografía no coincide con un JPEG o PNG válido.");
  if (file.type === "image/png") {
    const bytes = new Uint8Array(await file.slice(0, 24).arrayBuffer());
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (
      bytes.length < 24 ||
      signature.some((value, index) => bytes[index] !== value) ||
      bytes[12] !== 73 ||
      bytes[13] !== 72 ||
      bytes[14] !== 68 ||
      bytes[15] !== 82
    )
      throw invalid();
    const view = new DataView(bytes.buffer);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (file.type !== "image/jpeg") throw invalid();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) throw invalid();
  const view = new DataView(bytes.buffer);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 255) throw invalid();
    while (bytes[offset] === 255) offset += 1;
    const marker = bytes[offset++];
    if (marker === undefined || marker === 218 || marker === 217) throw invalid();
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
    if (offset + 2 > bytes.length) throw invalid();
    const length = view.getUint16(offset);
    if (length < 2 || offset + length > bytes.length) throw invalid();
    // Marcadores SOF, excluyendo DHT (C4), JPG (C8) y DAC (CC).
    if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
      if (length < 8) throw invalid();
      return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
    }
    offset += length;
  }
  throw invalid();
}
