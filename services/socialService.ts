
import { User, Friendship, Message, Group, ForumThread, ForumReply, Competition } from '../types';
import { getAllUsers } from './authService';

const FRIENDSHIPS_KEY = 'parnaso_friendships';
const MESSAGES_KEY = 'parnaso_messages';
const GROUPS_KEY = 'parnaso_groups';
const FORUM_THREADS_KEY = 'parnaso_forum_threads';
const FORUM_REPLIES_KEY = 'parnaso_forum_replies';
const COMPETITIONS_KEY = 'parnaso_competitions';

// --- Friendships ---

export const getFriendships = (): Friendship[] => {
  const stored = localStorage.getItem(FRIENDSHIPS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const sendFriendRequest = (requesterId: string, receiverId: string) => {
  const friendships = getFriendships();
  
  // Check if exists
  const exists = friendships.find(f => 
    (f.requesterId === requesterId && f.receiverId === receiverId) ||
    (f.requesterId === receiverId && f.requesterId === requesterId)
  );

  if (exists) throw new Error("Solicitação já enviada ou vocês já são amigos.");

  const newFriendship: Friendship = {
    id: Date.now().toString(),
    requesterId,
    receiverId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  friendships.push(newFriendship);
  localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(friendships));
  return newFriendship;
};

export const acceptFriendRequest = (friendshipId: string) => {
  const friendships = getFriendships();
  const index = friendships.findIndex(f => f.id === friendshipId);
  if (index !== -1) {
    friendships[index].status = 'accepted';
    localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(friendships));
  }
};

export const removeFriendship = (friendshipId: string) => {
  const friendships = getFriendships();
  const newFriendships = friendships.filter(f => f.id !== friendshipId);
  localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(newFriendships));
};

export const getFriendsList = (userId: string): { user: User, friendshipId: string }[] => {
  const friendships = getFriendships();
  const allUsers = getAllUsers();
  
  const accepted = friendships.filter(f => 
    f.status === 'accepted' && (f.requesterId === userId || f.receiverId === userId)
  );

  return accepted.map(f => {
    const friendId = f.requesterId === userId ? f.receiverId : f.requesterId;
    const friendUser = allUsers.find(u => u.id === friendId);
    return friendUser ? { user: friendUser, friendshipId: f.id } : null;
  }).filter(Boolean) as { user: User, friendshipId: string }[];
};

export const getPendingRequests = (userId: string): { user: User, friendshipId: string, type: 'received' | 'sent' }[] => {
  const friendships = getFriendships();
  const allUsers = getAllUsers();

  const pending = friendships.filter(f => f.status === 'pending' && (f.receiverId === userId || f.requesterId === userId));

  return pending.map(f => {
    const isReceived = f.receiverId === userId;
    const otherId = isReceived ? f.requesterId : f.receiverId;
    const otherUser = allUsers.find(u => u.id === otherId);
    
    return otherUser ? {
      user: otherUser,
      friendshipId: f.id,
      type: isReceived ? 'received' : 'sent'
    } : null;
  }).filter(Boolean) as any;
};

export const getAvailableUsers = (currentUserId: string): User[] => {
  const allUsers = getAllUsers();
  const friendships = getFriendships();

  // Filter out self, admins, blocked users, and existing friends/requests
  return allUsers.filter(u => {
    if (u.id === currentUserId) return false;
    if (u.role === 'admin') return false; // Usually don't add admins as writing buddies
    if (u.isBlocked) return false;

    const hasRelation = friendships.some(f => 
      (f.requesterId === currentUserId && f.receiverId === u.id) ||
      (f.requesterId === u.id && f.receiverId === currentUserId)
    );

    return !hasRelation;
  });
};

// --- GROUPS ---

export const getGroups = (): Group[] => {
  const stored = localStorage.getItem(GROUPS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getUserGroups = (userId: string): Group[] => {
  const groups = getGroups();
  return groups.filter(g => g.members.includes(userId));
};

export const createGroup = (name: string, adminId: string, memberIds: string[]) => {
  const groups = getGroups();
  const newGroup: Group = {
    id: Date.now().toString(),
    name,
    adminId,
    members: [adminId, ...memberIds],
    createdAt: new Date().toISOString()
  };
  groups.push(newGroup);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  return newGroup;
};

// --- Messages (Direct & Group) ---

export const getMessages = (): Message[] => {
  const stored = localStorage.getItem(MESSAGES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getConversation = (userId1: string, userId2: string): Message[] => {
  const allMessages = getMessages();
  return allMessages
    .filter(m => 
      !m.groupId && // Ensure direct message
      ((m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1))
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const getGroupMessages = (groupId: string): Message[] => {
  const allMessages = getMessages();
  return allMessages
    .filter(m => m.groupId === groupId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const sendMessage = (senderId: string, receiverId: string, content: string): Message => {
  const messages = getMessages();
  const newMessage: Message = {
    id: Date.now().toString(),
    senderId,
    receiverId,
    content,
    timestamp: new Date().toISOString(),
    read: false
  };
  messages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  return newMessage;
};

export const sendGroupMessage = (senderId: string, groupId: string, content: string): Message => {
  const messages = getMessages();
  const newMessage: Message = {
    id: Date.now().toString(),
    senderId,
    groupId,
    content,
    timestamp: new Date().toISOString(),
    read: false
  };
  messages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  return newMessage;
};

export const markAsRead = (senderId: string, receiverId: string) => {
  const messages = getMessages();
  let changed = false;
  messages.forEach(m => {
    if (m.senderId === senderId && m.receiverId === receiverId && !m.read && !m.groupId) {
      m.read = true;
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }
};

// --- FORUM ---

export const getForumThreads = (): ForumThread[] => {
  const stored = localStorage.getItem(FORUM_THREADS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getForumReplies = (threadId: string): ForumReply[] => {
  const stored = localStorage.getItem(FORUM_REPLIES_KEY);
  const allReplies = stored ? JSON.parse(stored) : [];
  return allReplies.filter((r: ForumReply) => r.threadId === threadId);
};

export const createForumThread = (authorId: string, title: string, content: string, category: ForumThread['category']) => {
  const threads = getForumThreads();
  const newThread: ForumThread = {
    id: Date.now().toString(),
    authorId,
    title,
    content,
    category,
    createdAt: new Date().toISOString(),
    likes: []
  };
  threads.unshift(newThread); // Add to top
  localStorage.setItem(FORUM_THREADS_KEY, JSON.stringify(threads));
  return newThread;
};

export const replyToThread = (authorId: string, threadId: string, content: string) => {
  const stored = localStorage.getItem(FORUM_REPLIES_KEY);
  const replies = stored ? JSON.parse(stored) : [];
  const newReply: ForumReply = {
    id: Date.now().toString(),
    threadId,
    authorId,
    content,
    createdAt: new Date().toISOString()
  };
  replies.push(newReply);
  localStorage.setItem(FORUM_REPLIES_KEY, JSON.stringify(replies));
  return newReply;
};

// --- COMPETITIONS ---

export const getCompetitions = (): Competition[] => {
  const stored = localStorage.getItem(COMPETITIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const createCompetition = (
  creatorId: string, 
  title: string, 
  description: string, 
  type: 'word_count' | 'days_streak',
  target: number, 
  durationDays: number
) => {
  const comps = getCompetitions();
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const newComp: Competition = {
    id: Date.now().toString(),
    creatorId,
    title,
    description,
    type,
    target,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    participants: [creatorId],
    status: 'active'
  };
  comps.push(newComp);
  localStorage.setItem(COMPETITIONS_KEY, JSON.stringify(comps));
  return newComp;
};

export const joinCompetition = (competitionId: string, userId: string) => {
  const comps = getCompetitions();
  const index = comps.findIndex(c => c.id === competitionId);
  if (index !== -1 && !comps[index].participants.includes(userId)) {
    comps[index].participants.push(userId);
    localStorage.setItem(COMPETITIONS_KEY, JSON.stringify(comps));
  }
};
