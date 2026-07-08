import exifr from 'exifr';

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5MB is enough for EXIF/MakerNotes without overloading memory

/**
 * Parses the Exif and MakerNotes from an image file.
 */
export async function extractMetadata(file: File) {
  try {
    // 1. Slice the file using the native Blob.slice method.
    // This is extremely memory efficient compared to streams or loading the whole file,
    // which prevents "low memory" crashes on mobile devices.
    const blobSlice = file.slice(0, DEFAULT_MAX_BYTES);
    const arrayBuffer = await blobSlice.arrayBuffer();
    
    // 2. Parse using exifr
    // We request TIFF (which includes Exif) and MakerNotes.
    const options = {
      tiff: true,
      exif: true,
      makerNote: true,
      mergeOutput: false,
    };
    
    const parsed = await exifr.parse(arrayBuffer, options);
    
    if (!parsed) {
      throw new Error('No metadata found in the first 5MB chunk.');
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
