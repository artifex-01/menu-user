export interface Store {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating?: number;
  imageUrl?: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
