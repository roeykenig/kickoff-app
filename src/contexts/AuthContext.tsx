import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../types';

const STORAGE_KEY = 'kickoff_users';
const CURRENT_KEY = 'kickoff_current_user';

// Mock player IDs don't exist in the users store — friend requests to them are auto-accepted
const isMockPlayer = (id: string) => id.startsWith('p');

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => string | null;
  register: (data: Omit<AuthUser, 'id' | 'rating' | 'gamesPlayed' | 'ratingHistory' | 'lobbyHistory' | 'friends' | 'sentRequests' | 'pendingRequests'>) => void;
  logout: () => void;
  getAllUsers: () => AuthUser[];
  sendFriendRequest: (targetId: string) => void;
  acceptFriendRequest: (requesterId: string) => void;
  declineFriendRequest: (requesterId: string) => void;
  removeFriend: (friendId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    // Backfill fields added in later versions
    return {
      friends: [], sentRequests: [], pendingRequests: [],
      ratingHistory: [], lobbyHistory: [],
      ...u,
    };
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  }, [currentUser]);

  const getAllUsers = (): AuthUser[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  };

  const saveUsers = (users: AuthUser[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  };

  const updateUserInStore = (updated: AuthUser) => {
    const users = getAllUsers().map(u => u.id === updated.id ? updated : u);
    saveUsers(users);
  };

  const login = (email: string, password: string): string | null => {
    const users = getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return 'אימייל או סיסמה שגויים';
    setCurrentUser(user);
    return null;
  };

  const register = (data: Omit<AuthUser, 'id' | 'rating' | 'gamesPlayed' | 'ratingHistory' | 'lobbyHistory' | 'friends' | 'sentRequests' | 'pendingRequests'>) => {
    const users = getAllUsers();
    const newUser: AuthUser = {
      ...data,
      id: `user_${Date.now()}`,
      rating: 5,
      gamesPlayed: 0,
      ratingHistory: [],
      lobbyHistory: [],
      friends: [],
      sentRequests: [],
      pendingRequests: [],
    };
    saveUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  const logout = () => setCurrentUser(null);

  const sendFriendRequest = (targetId: string) => {
    if (!currentUser) return;
    if (currentUser.friends.includes(targetId)) return;
    if (currentUser.sentRequests.includes(targetId)) return;

    if (isMockPlayer(targetId)) {
      // Auto-accept for mock players
      const updated = { ...currentUser, friends: [...currentUser.friends, targetId] };
      setCurrentUser(updated);
      updateUserInStore(updated);
    } else {
      // Request flow for registered users
      const users = getAllUsers();
      const updatedUsers = users.map(u => {
        if (u.id === currentUser.id) return { ...u, sentRequests: [...u.sentRequests, targetId] };
        if (u.id === targetId) return { ...u, pendingRequests: [...u.pendingRequests, currentUser.id] };
        return u;
      });
      saveUsers(updatedUsers);
      const updatedMe = updatedUsers.find(u => u.id === currentUser.id)!;
      setCurrentUser(updatedMe);
    }
  };

  const acceptFriendRequest = (requesterId: string) => {
    if (!currentUser) return;
    const users = getAllUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          friends: [...u.friends, requesterId],
          pendingRequests: u.pendingRequests.filter(id => id !== requesterId),
        };
      }
      if (u.id === requesterId) {
        return {
          ...u,
          friends: [...u.friends, currentUser.id],
          sentRequests: u.sentRequests.filter(id => id !== currentUser.id),
        };
      }
      return u;
    });
    saveUsers(updatedUsers);
    const updatedMe = updatedUsers.find(u => u.id === currentUser.id)!;
    setCurrentUser(updatedMe);
  };

  const declineFriendRequest = (requesterId: string) => {
    if (!currentUser) return;
    const users = getAllUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, pendingRequests: u.pendingRequests.filter(id => id !== requesterId) };
      }
      if (u.id === requesterId) {
        return { ...u, sentRequests: u.sentRequests.filter(id => id !== currentUser.id) };
      }
      return u;
    });
    saveUsers(updatedUsers);
    const updatedMe = updatedUsers.find(u => u.id === currentUser.id)!;
    setCurrentUser(updatedMe);
  };

  const removeFriend = (friendId: string) => {
    if (!currentUser) return;
    const users = getAllUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) return { ...u, friends: u.friends.filter(id => id !== friendId) };
      if (u.id === friendId) return { ...u, friends: u.friends.filter(id => id !== currentUser.id) };
      return u;
    });
    saveUsers(updatedUsers);
    const updatedMe = updatedUsers.find(u => u.id === currentUser.id)!;
    setCurrentUser(updatedMe);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, login, register, logout, getAllUsers,
      sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
