export type Language = 'he' | 'en';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

export interface RatingEntry {
  date: string;
  rating: number;
  change: number;
  lobbyTitle: string;
  lobbyId: string;
}

export interface LobbyHistoryEntry {
  lobbyId: string;
  lobbyTitle: string;
  date: string;
  city: string;
  fieldName: string;
  ratingChange: number;
}

export interface Player {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  rating: number;        // 1–10
  gamesPlayed: number;
  position?: string;
  bio?: string;
  email?: string;
  photoUrl?: string;
  ratingHistory: RatingEntry[];
  lobbyHistory: LobbyHistoryEntry[];
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
  numTeams?: number;
  playersPerTeam?: number;
  minRating?: number;
  isPrivate: boolean;
  price?: number;
  description?: string;
  createdBy: string;
  distanceKm: number;
  waitlist: Player[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  initials: string;
  avatarColor: string;
  rating: number;
  gamesPlayed: number;
  position?: string;
  bio?: string;
  photoUrl?: string;
  ratingHistory: RatingEntry[];
  lobbyHistory: LobbyHistoryEntry[];
  friends: string[];
  sentRequests: string[];
  pendingRequests: string[];
}
