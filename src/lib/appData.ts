import type { Lobby, Player, RatingEntry, LobbyHistoryEntry } from '../types';
import { requireSupabase } from './supabase';
import { getJoinLobbyError, normalizeText, validateCreateLobbyPayload } from './validation';

type ProfileRow = {
  id: string;
  email: string | null;
  name: string;
  initials: string;
  avatar_color: string;
  rating: number;
  games_played: number;
  position: string | null;
  bio: string | null;
  photo_url: string | null;
  rating_history: RatingEntry[];
  lobby_history: LobbyHistoryEntry[];
};

type LobbyRow = {
  id: string;
  title: string;
  field_name: string;
  address: string;
  city: string;
  datetime: string;
  max_players: number;
  num_teams: number | null;
  players_per_team: number | null;
  min_rating: number | null;
  is_private: boolean;
  price: number | null;
  description: string | null;
  created_by: string;
  distance_km: number;
};

type MembershipRow = {
  lobby_id: string;
  profile_id: string;
  status: 'joined' | 'waitlisted' | 'pending_confirm' | 'left';
  created_at?: string;
};

function mapProfile(row: ProfileRow): Player {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    avatarColor: row.avatar_color,
    rating: row.rating,
    gamesPlayed: row.games_played,
    position: row.position ?? undefined,
    bio: row.bio ?? undefined,
    email: row.email ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    ratingHistory: row.rating_history ?? [],
    lobbyHistory: row.lobby_history ?? [],
  };
}

export async function fetchProfiles(): Promise<Player[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, initials, avatar_color, rating, games_played, position, bio, photo_url, rating_history, lobby_history')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfileRow[]).map(mapProfile);
}

export async function fetchProfileById(id: string): Promise<Player | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, initials, avatar_color, rating, games_played, position, bio, photo_url, rating_history, lobby_history')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfile(data as ProfileRow) : null;
}

export async function fetchLobbies(): Promise<Lobby[]> {
  const supabase = requireSupabase();

  const [{ data: lobbyRows, error: lobbiesError }, { data: profileRows, error: profilesError }, { data: membershipRows, error: membershipsError }] = await Promise.all([
    supabase
      .from('lobbies')
      .select('id, title, field_name, address, city, datetime, max_players, num_teams, players_per_team, min_rating, is_private, price, description, created_by, distance_km')
      .order('datetime', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, email, name, initials, avatar_color, rating, games_played, position, bio, photo_url, rating_history, lobby_history'),
    supabase
      .from('lobby_memberships')
      .select('lobby_id, profile_id, status, created_at'),
  ]);

  if (lobbiesError) {
    throw lobbiesError;
  }
  if (profilesError) {
    throw profilesError;
  }
  if (membershipsError) {
    throw membershipsError;
  }

  const playersById = new Map<string, Player>(((profileRows ?? []) as ProfileRow[]).map((row) => [row.id, mapProfile(row)]));
  const membershipsByLobby = new Map<string, MembershipRow[]>();

  for (const membership of (membershipRows ?? []) as MembershipRow[]) {
    const list = membershipsByLobby.get(membership.lobby_id) ?? [];
    list.push(membership);
    membershipsByLobby.set(membership.lobby_id, list);
  }

  return ((lobbyRows ?? []) as LobbyRow[]).map((row) => {
    const memberships = [...(membershipsByLobby.get(row.id) ?? [])].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
    const players = memberships
      .filter((membership) => membership.status === 'joined')
      .map((membership) => playersById.get(membership.profile_id))
      .filter((player): player is Player => Boolean(player));

    const waitlist = memberships
      .filter((membership) => membership.status === 'waitlisted')
      .map((membership) => playersById.get(membership.profile_id))
      .filter((player): player is Player => Boolean(player));

    return {
      id: row.id,
      title: row.title,
      fieldName: row.field_name,
      address: row.address,
      city: row.city,
      datetime: row.datetime,
      players,
      maxPlayers: row.max_players,
      numTeams: row.num_teams ?? undefined,
      playersPerTeam: row.players_per_team ?? undefined,
      minRating: row.min_rating ?? undefined,
      isPrivate: row.is_private,
      price: row.price ?? undefined,
      description: row.description ?? undefined,
      createdBy: row.created_by,
      distanceKm: row.distance_km,
      waitlist,
    };
  });
}

export async function fetchLobbyById(id: string): Promise<Lobby | null> {
  const lobbies = await fetchLobbies();
  return lobbies.find((lobby) => lobby.id === id) ?? null;
}

export type CreateLobbyInput = {
  title: string;
  fieldName: string;
  address: string;
  city: string;
  datetime: string;
  maxPlayers: number;
  numTeams?: number;
  playersPerTeam?: number;
  minRating?: number;
  price?: number;
  description?: string;
  createdBy: string;
};

export async function createLobby(input: CreateLobbyInput): Promise<string> {
  const draftErrors = validateCreateLobbyPayload({
    title: input.title,
    fieldName: input.fieldName,
    address: input.address,
    city: input.city,
    datetime: input.datetime,
    numTeams: input.numTeams ?? 0,
    playersPerTeam: input.playersPerTeam ?? 0,
    minRating: input.minRating ?? 1,
    price: input.price,
    description: input.description,
  });

  if (draftErrors.length > 0) {
    throw new Error(draftErrors[0]);
  }

  const supabase = requireSupabase();
  const id = `lobby_${crypto.randomUUID()}`;

  const { error: lobbyError } = await supabase.from('lobbies').insert({
    id,
    title: normalizeText(input.title),
    field_name: normalizeText(input.fieldName),
    address: normalizeText(input.address),
    city: normalizeText(input.city),
    datetime: input.datetime,
    max_players: input.maxPlayers,
    num_teams: input.numTeams ?? null,
    players_per_team: input.playersPerTeam ?? null,
    min_rating: input.minRating ?? null,
    is_private: false,
    price: input.price ?? null,
    description: input.description ? normalizeText(input.description) : null,
    created_by: input.createdBy,
    distance_km: 0,
  });

  if (lobbyError) {
    throw lobbyError;
  }

  const { error: membershipError } = await supabase.from('lobby_memberships').insert({
    lobby_id: id,
    profile_id: input.createdBy,
    status: 'joined',
  });

  if (membershipError) {
    throw membershipError;
  }

  return id;
}

export async function upsertLobbyMembership(lobbyId: string, profileId: string, status: MembershipRow['status']) {
  const supabase = requireSupabase();

  if (status === 'joined' || status === 'waitlisted') {
    const [lobby, profile] = await Promise.all([fetchLobbyById(lobbyId), fetchProfileById(profileId)]);
    const resolvedLobby = lobby;
    const joinError =
      resolvedLobby && profile
        ? getJoinLobbyError(resolvedLobby, profile, { allowExistingWaitlist: status === 'joined' })
        : 'Failed to resolve player or game.';

    if (joinError) {
      throw new Error(joinError);
    }

    if (!resolvedLobby || !profile) {
      throw new Error('Failed to resolve player or game.');
    }

    if (status === 'joined') {
      const joinedCount = resolvedLobby.players.length;
      if (joinedCount >= resolvedLobby.maxPlayers) {
        throw new Error('This game is full right now.');
      }
    }
  }

  const { error } = await supabase.from('lobby_memberships').upsert(
    {
      lobby_id: lobbyId,
      profile_id: profileId,
      status,
    },
    { onConflict: 'lobby_id,profile_id' },
  );

  if (error) {
    throw error;
  }
}

export async function deleteLobbyMembership(lobbyId: string, profileId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from('lobby_memberships')
    .delete()
    .eq('lobby_id', lobbyId)
    .eq('profile_id', profileId);

  if (error) {
    throw error;
  }
}
