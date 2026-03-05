
import data from '@/app/lib/placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Zero-crash guard for JSON parsing
export const PlaceHolderImages: ImagePlaceholder[] = (data && typeof data === 'object' && 'placeholderImages' in data) 
  ? (data.placeholderImages as ImagePlaceholder[]) 
  : [];
