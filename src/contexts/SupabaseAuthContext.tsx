import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, LobbyHistoryEntry, RatingEntry } from '../types';
import { requireSupabase } from '../lib/supabase';
import { uploadAvatar } from '../lib/storage';

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
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

type FriendRequestRow = {
  from_profile_id: string;
  to_profile_id: string;
  status: 'pending' | 'accepted' | 'declined';
};

type RegisterInput = {
  name: string;
  email: string;
  password?: string;
  initials: string;
  avatarColor: string;
  position?: string;
  bio?: string;
  photoFile?: File;
};

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: RegisterInput) => Promise<string | null>;
  logout: () => Promise<void>;
  getAllUsers: () => AuthUser[];
  sendFriendRequest: (targetId: string) => Promise<void>;
  acceptFriendRequest: (requesterId: string) => Promise<void>;
  declineFriendRequest: (requesterId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapProfileToAuthUser(profile: ProfileRow, overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email ?? '',
    initials: profile.initials,
    avatarColor: profile.avatar_color,
    rating: profile.rating,
    gamesPlayed: profile.games_played,
    position: profile.position ?? undefined,
    bio: profile.bio ?? undefined,
    photoUrl: profile.photo_url ?? undefined,
    ratingHistory: profile.rating_history ?? [],
    lobbyHistory: profile.lobby_history ?? [],
    friends: [],
    sentRequests: [],
    pendingRequests: [],
    ...overrides,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = requireSupabase();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);

  async function refresh(authUserId: string | null) {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, auth_user_id, email, name, initials, avatar_color, rating, games_played, position, bio, photo_url, rating_history, lobby_history')
      .order('name', { ascending: true });

    if (profilesError) {
      throw profilesError;
    }

    const profiles = (profilesData ?? []) as ProfileRow[];
    setAllUsers(profiles.map((profile) => mapProfileToAuthUser(profile)));

    if (!authUserId) {
      setCurrentUser(null);
      return;
    }

    const currentProfile = profiles.find((profile) => profile.auth_user_id === authUserId) ?? null;
    if (!currentProfile) {
      setCurrentUser(null);
      return;
    }

    const { data: requestsData, error: requestsError } = await supabase
      .from('friend_requests')
      .select('from_profile_id, to_profile_id, status')
      .or(`from_profile_id.eq.${currentProfile.id},to_profile_id.eq.${currentProfile.id}`);

    if (requestsError) {
      throw requestsError;
    }

    const requests = (requestsData ?? []) as FriendRequestRow[];
    const friends = requests
      .filter((request) => request.status === 'accepted')
      .map((request) => (request.from_profile_id === currentProfile.id ? request.to_profile_id : request.from_profile_id));

    const sentRequests = requests
      .filter((request) => request.status === 'pending' && request.from_profile_id === currentProfile.id)
      .map((request) => request.to_profile_id);

    const pendingRequests = requests
      .filter((request) => request.status === 'pending' && request.to_profile_id === currentProfile.id)
      .map((request) => request.from_profile_id);

    setCurrentUser(
      mapProfileToAuthUser(currentProfile, {
        friends,
        sentRequests,
        pendingRequests,
      }),
    );
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !active) {
        return;
      }

      await refresh(data.user?.id ?? null);
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        void refresh(null);
        return;
      }

      void refresh(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return error.message;
    }

    const { data } = await supabase.auth.getUser();
    await refresh(data.user?.id ?? null);
    return null;
  };

  const register = async (data: RegisterInput): Promise<string | null> => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password ?? '',
    });

    if (error) {
      return error.message;
    }

    const authUser = signUpData.user;
    if (!authUser) {
      return 'Failed to create account';
    }

    let photoUrl: string | null = null;

    if (data.photoFile) {
      try {
        photoUrl = await uploadAvatar(data.photoFile, authUser.id);
      } catch (uploadError) {
        return uploadError instanceof Error ? uploadError.message : 'Failed to upload avatar';
      }
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.id,
      auth_user_id: authUser.id,
      email: data.email,
      name: data.name,
      initials: data.initials,
      avatar_color: data.avatarColor,
      rating: 5,
      games_played: 0,
      position: data.position ?? null,
      bio: data.bio ?? null,
      photo_url: photoUrl,
      rating_history: [],
      lobby_history: [],
      is_mock: false,
    });

    if (profileError) {
      return profileError.message;
    }

    await refresh(authUser.id);
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const getAllUsers = () => allUsers;

  const sendFriendRequest = async (targetId: string) => {
    if (!currentUser) {
      return;
    }

    if (currentUser.friends.includes(targetId) || currentUser.sentRequests.includes(targetId)) {
      return;
    }

    const status = targetId.startsWith('p') ? 'accepted' : 'pending';
    const payload = {
      from_profile_id: currentUser.id,
      to_profile_id: targetId,
      status,
      responded_at: status === 'accepted' ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from('friend_requests').upsert(payload, { onConflict: 'from_profile_id,to_profile_id' });
    if (error) {
      throw error;
    }

    await refresh((await supabase.auth.getUser()).data.user?.id ?? null);
  };

  const acceptFriendRequest = async (requesterId: string) => {
    if (!currentUser) {
      return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('from_profile_id', requesterId)
      .eq('to_profile_id', currentUser.id)
      .eq('status', 'pending');

    if (error) {
      throw error;
    }

    await refresh((await supabase.auth.getUser()).data.user?.id ?? null);
  };

  const declineFriendRequest = async (requesterId: string) => {
    if (!currentUser) {
      return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('from_profile_id', requesterId)
      .eq('to_profile_id', currentUser.id)
      .eq('status', 'pending');

    if (error) {
      throw error;
    }

    await refresh((await supabase.auth.getUser()).data.user?.id ?? null);
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser) {
      return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .or(`and(from_profile_id.eq.${currentUser.id},to_profile_id.eq.${friendId}),and(from_profile_id.eq.${friendId},to_profile_id.eq.${currentUser.id})`)
      .eq('status', 'accepted');

    if (error) {
      throw error;
    }

    await refresh((await supabase.auth.getUser()).data.user?.id ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        getAllUsers,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
