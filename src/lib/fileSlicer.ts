import exifr from 'exifr';

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2MB is usually enough for EXIF/MakerNotes

/**
 * Reads only the first chunk of a file using the Web Streams API.
 * This ensures we don't load a 100MB RAW file into memory just to read its metadata.
 */
export async function readChunkWithStreams(file: File, maxBytes = DEFAULT_MAX_BYTES): Promise<Uint8Array> {
  const stream = file.stream();
  const reader = stream.getReader();
  let bytesRead = 0;
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      bytesRead += value.length;
      
      if (bytesRead >= maxBytes) {
        // Cancel stream to avoid reading the rest of the massive RAW file
        await reader.cancel('Reached required metadata chunk size');
        break;
      }
    }
  } catch (error) {
    console.error('Error slicing stream:', error);
    throw error;
  }

  // Combine chunks into a single Uint8Array
  const result = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Parses the Exif and MakerNotes from an image file.
 */
export async function extractMetadata(file: File) {
  try {
    // 1. Slice the file (Zero-Bandwidth concept for local processing before any hypothetical upload)
    const chunk = await readChunkWithStreams(file);
    
    // 2. Parse using exifr
    // We request TIFF (which includes Exif) and MakerNotes.
    const options = {
      tiff: true,
      exif: true,
      makerNote: true,
      mergeOutput: false,
    };
    
    const parsed = await exifr.parse(chunk, options);
    
    if (!parsed) {
      throw new Error('No metadata found in the first 2MB chunk.');
    }

    // Attempt to find Shutter Count across common vendor tags
    // Some common keys: 'ShutterCount', 'ImageCount', 'ImageNumber', etc.
    let shutterCount = null;
    
    const allTags = { ...parsed.exif, ...parsed.makerNote, ...parsed.tiff };
    
    if (allTags.ShutterCount) shutterCount = parseInt(allTags.ShutterCount, 10);
    else if (allTags.ImageCount) shutterCount = parseInt(allTags.ImageCount, 10);
    else if (allTags.ImageNumber) shutterCount = parseInt(allTags.ImageNumber, 10);

    const make = allTags.Make || 'Unknown Make';
    const model = allTags.Model || 'Unknown Model';
    const serialNumber = allTags.SerialNumber || allTags.InternalSerialNumber || null;
    const firmware = allTags.Software || null;

    // Estimate lifespan based on typical prosumer models (simplified logic)
    let estimatedLifespan = 150000;
    if (model.includes('1D') || model.includes('D5') || model.includes('A9') || model.includes('A1')) {
      estimatedLifespan = 400000; // Pro bodies
    } else if (model.includes('5D') || model.includes('A7') || model.includes('D8')) {
      estimatedLifespan = 200000; // Semi-pro bodies
    }

    let healthScore = 100;
    if (shutterCount !== null) {
      healthScore = Math.max(0, 100 - (shutterCount / estimatedLifespan) * 100);
    }

    return {
      make,
      model,
      shutterCount,
      serialNumber,
      firmware,
      healthScore,
      estimatedLifespan
    };

  } catch (error) {
    console.error('Metadata extraction failed:', error);
    throw error;
  }
}
