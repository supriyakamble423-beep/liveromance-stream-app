import data from '@/app/lib/placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Defensive check to prevent 'Unexpected end of JSON' if data is malformed
export const PlaceHolderImages: ImagePlaceholder[] = data?.placeholderImages || [];
