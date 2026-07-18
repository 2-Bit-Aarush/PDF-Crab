import * as fs from 'fs';
import * as path from 'path';

export interface ResolvedAsset {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
}

export class AssetResolver {
  static async resolve(reference: any): Promise<ResolvedAsset | null> {
    try {
      if (!reference) return null;

      let buffer: Buffer | null = null;

      // 1. If it's already a binary buffer
      if (Buffer.isBuffer(reference)) {
        buffer = reference;
      }
      // 1.5 If it's a relative public path like /temp-crops/...
      else if (typeof reference === 'string' && reference.startsWith('/temp-crops/')) {
        let publicDir = path.join(process.cwd(), 'public');
        const absoluteCrabPath = 'C:\\Users\\DELL\\OneDrive\\Documents\\Projects\\PDF-Crab\\public';
        if (fs.existsSync(absoluteCrabPath)) {
          publicDir = absoluteCrabPath;
        }
        const localPath = path.join(publicDir, reference.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          buffer = fs.readFileSync(localPath);
        }
      }
      // 2. If it's a local file path
      else if (typeof reference === 'string' && (fs.existsSync(reference) || path.isAbsolute(reference))) {
        if (fs.existsSync(reference)) {
          buffer = fs.readFileSync(reference);
        }
      }
      // 3. If it's a URL (public URL, signed URL, storage object key URL)
      else if (typeof reference === 'string' && (reference.startsWith('http://') || reference.startsWith('https://'))) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const isSupabaseUrl = reference.includes('supabase.co/storage/v1/object/');

        // Retrieve buffer with retries
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const headers: Record<string, string> = {}
            if (isSupabaseUrl && serviceRoleKey) {
              headers['apikey'] = serviceRoleKey;
              headers['Authorization'] = `Bearer ${serviceRoleKey}`;
            }

            const res = await fetch(reference, { headers });
            if (res.ok) {
              buffer = Buffer.from(await res.arrayBuffer());
              break;
            }
            throw new Error(`HTTP status ${res.status}`);
          } catch (err) {
            if (attempt === 3) throw err;
            await new Promise(resolve => setTimeout(resolve, attempt * 300));
          }
        }
      }

      // If buffer couldn't be loaded
      if (!buffer || buffer.length === 0) {
        return null;
      }

      // Automatically scan and strip any prepended base64 data URI wrapper bytes
      let startOffset = 0;
      for (let i = 0; i < Math.min(buffer.length - 4, 100); i++) {
        // PNG magic bytes
        if (buffer[i] === 0x89 && buffer[i+1] === 0x50 && buffer[i+2] === 0x4E && buffer[i+3] === 0x47) {
          startOffset = i;
          break;
        }
        // JPEG magic bytes
        if (buffer[i] === 0xFF && buffer[i+1] === 0xD8) {
          startOffset = i;
          break;
        }
      }
      if (startOffset > 0) {
        buffer = buffer.slice(startOffset);
      }

      // Convert using Jimp to standard PNG buffer to prevent pdfkit "Unknown image format" error
      try {
        const { Jimp: JimpLib } = await import('jimp');
        const img = await JimpLib.read(buffer as Buffer);
        buffer = await img.getBuffer('image/png');
      } catch (e) {
        console.warn('AssetResolver: Jimp normalization failed:', e);
      }

      // 4. Validate image & extract dimensions
      const validation = this.validateImage(buffer as Buffer);
      if (!validation.valid) {
        console.warn(`AssetResolver: Image validation failed for reference: ${reference}`);
        return null;
      }

      return {
        buffer: buffer as Buffer,
        contentType: validation.contentType,
        width: validation.width,
        height: validation.height
      };
    } catch (err) {
      console.error(`AssetResolver: Failed to resolve reference: ${reference}. Error:`, err);
      return null;
    }
  }

  public static validateImage(buffer: Buffer): { valid: boolean; contentType: string; width: number; height: number } {
    if (buffer.length < 8) return { valid: false, contentType: '', width: 0, height: 0 };

    // PNG Check
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      if (buffer.length < 24) return { valid: false, contentType: 'image/png', width: 0, height: 0 };
      const width = buffer.readInt32BE(16);
      const height = buffer.readInt32BE(20);
      const nonBlank = buffer.some(val => val !== 0x00);
      return {
        valid: width > 0 && height > 0 && nonBlank,
        contentType: 'image/png',
        width,
        height
      };
    }

    // JPEG Check
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (offset + 2 > buffer.length) break;
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xFFC0 || marker === 0xFFC2) {
          if (offset + 5 > buffer.length) break;
          offset += 3;
          const height = buffer.readUInt16BE(offset);
          const width = buffer.readUInt16BE(offset + 2);
          return {
            valid: width > 0 && height > 0,
            contentType: 'image/jpeg',
            width,
            height
          };
        }
        if (offset + 2 > buffer.length) break;
        const length = buffer.readUInt16BE(offset);
        offset += length;
      }
    }

    // Fallback: non-empty buffer check
    const nonBlank = buffer.some(val => val !== 0x00);
    return {
      valid: buffer.length > 50 && nonBlank,
      contentType: 'image/png',
      width: 150,
      height: 150
    };
  }
}
