export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';
export type Language = 'he' | 'en';

export interface Player {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  rating: number;
  gamesPlayed: number;
  position?: string;
}

export interface Lobby {
  id: string;
  title: string;
  fieldName: string;
  address: string;
  city: string;
  datetime: string;
  players: Player[];
  maxPlayers: number;
  skillLevel: SkillLevel;
  isPrivate: boolean;
  price?: number;
  description?: string;
  createdBy: string;
  distanceKm: number;
}
