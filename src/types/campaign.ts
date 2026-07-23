// Frontend-facing Campaign type (derived from API response)
export interface Campaign {
  id: number;
  titleEn: string;
  titleFr: string | null;
  titleAr: string | null;
  locationEn: string;
  locationFr: string | null;
  locationAr: string | null;
  descriptionEn: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  date: string;
  slug: string;
  image: string | null;
  galleryImages: string[] | null;
  filterTags: string;
  mapX: number | null;
  mapY: number | null;
  isActive: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  statsWasteKg: number | null;
  statsTrees: number | null;
  statsVolunteers: number | null;
  statsNeighborhoods: number | null;
  eventDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
