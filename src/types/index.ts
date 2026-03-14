/**
 * @fileOverview Global type definitions for the GlobalStream application.
 */

export type TabType = 'home' | 'discover' | 'map' | 'stream' | 'chat' | 'profile';

export interface Stream {
  id: string;
  hostName: string;
  viewers: string | number;
  region: string;
  isPublic: boolean;
  imageUrl?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  diamonds: number;
  photoURL?: string;
  isHost: boolean;
  verified: boolean;
}
