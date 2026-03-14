
'use client';

import data from '@/app/lib/placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

/**
 * PlaceHolderImages
 * Safe accessor for placeholder data to prevent "Unexpected end of JSON input" 
 * or parsing errors if the JSON file is modified incorrectly.
 */
const getPlaceholderData = (): ImagePlaceholder[] => {
  try {
    if (data && typeof data === 'object' && Array.isArray(data.placeholderImages)) {
      return data.placeholderImages as ImagePlaceholder[];
    }
  } catch (e) {
    console.error("Failed to parse placeholder images JSON:", e);
  }
  return [];
};

export const PlaceHolderImages: ImagePlaceholder[] = getPlaceholderData();
