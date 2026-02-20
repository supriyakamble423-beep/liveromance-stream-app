import { PlaceHolderImages } from "./placeholder-images";

export type Host = {
  id: string;
  name: string;
  age: number;
  country: string;
  flag: string;
  isLive: boolean;
  viewers?: string;
  categories: string[];
  imageUrl: string;
  rating: number;
};

export const MOCK_HOSTS: Host[] = [
  {
    id: "1",
    name: "Mariana",
    age: 22,
    country: "Brazil",
    flag: "🇧🇷",
    isLive: true,
    viewers: "1.2k",
    categories: ["Girls", "Gaming"],
    imageUrl: PlaceHolderImages.find(img => img.id === "host-1")?.imageUrl || "https://picsum.photos/seed/host1/600/800",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Liam",
    age: 25,
    country: "UK",
    flag: "🇬🇧",
    isLive: false,
    categories: ["Boys", "Music"],
    imageUrl: PlaceHolderImages.find(img => img.id === "host-2")?.imageUrl || "https://picsum.photos/seed/host2/600/800",
    rating: 4.5,
  },
  {
    id: "3",
    name: "Sophia",
    age: 24,
    country: "Germany",
    flag: "🇩🇪",
    isLive: true,
    viewers: "850",
    categories: ["Girls", "Talk"],
    imageUrl: PlaceHolderImages.find(img => img.id === "host-3")?.imageUrl || "https://picsum.photos/seed/host3/600/800",
    rating: 4.9,
  },
  {
    id: "4",
    name: "Ethan",
    age: 27,
    country: "USA",
    flag: "🇺🇸",
    isLive: false,
    categories: ["Boys", "Fitness"],
    imageUrl: PlaceHolderImages.find(img => img.id === "host-4")?.imageUrl || "https://picsum.photos/seed/host4/600/800",
    rating: 4.2,
  },
  {
    id: "5",
    name: "Chloe",
    age: 21,
    country: "France",
    flag: "🇫🇷",
    isLive: true,
    viewers: "2.1k",
    categories: ["Girls", "Fashion"],
    imageUrl: PlaceHolderImages.find(img => img.id === "host-5")?.imageUrl || "https://picsum.photos/seed/host5/600/800",
    rating: 4.7,
  },
  {
    id: "6",
    name: "Malik",
    age: 26,
    country: "Kenya",
    flag: "🇰🇪",
    isLive: false,
    categories: ["Boys", "Cooking"],
    imageUrl: PlaceHolderImages.find(img => img.id === "host-6")?.imageUrl || "https://picsum.photos/seed/host6/600/800",
    rating: 4.6,
  },
];
