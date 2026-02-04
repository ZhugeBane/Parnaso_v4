import { User } from '../types';

const USERS_KEY = 'parnaso_users';
const CURRENT_USER_KEY = 'parnaso_current_user';

export const register = (name: string, email: string, password: string): User => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    throw new Error('E-mail já cadastrado.');
  }

  // Hardcode admin role for specific email
  const isAdmin = email === 'admin@parnaso.com';
  const role = isAdmin ? 'admin' : 'user';

  // New users (except admin) start blocked (Pending Approval)
  const isBlocked = !isAdmin; 

  const newUser: User = {
    id: Date.now().toString(),
    name,
    email,
    password, 
    role,
    isBlocked
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Auto login only if not blocked (Admin), otherwise throw message
  if (!isBlocked) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  }
  
  return newUser;
};

export const login = (email: string, password: string): User => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];

  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('E-mail ou senha inválidos.');
  }

  if (user.isBlocked) {
    throw new Error('Conta pendente de aprovação ou bloqueada pelo administrador.');
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  
  // Refresh user data from DB to check for blocks/role changes
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  const freshUser = users.find(u => u.id === user.id);
  
  return freshUser || null;
};

// --- Password Recovery ---

export const checkUserExists = (email: string): boolean => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  return users.some(u => u.email === email);
};

export const resetPassword = (email: string, newPassword: string) => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  const index = users.findIndex(u => u.email === email);
  if (index === -1) {
    throw new Error('Usuário não encontrado.');
  }

  users[index].password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// --- Admin Functions ---

export const getAllUsers = (): User[] => {
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

export const toggleUserBlock = (userId: string): User[] => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    // Don't block admin
    if (users[index].role === 'admin') return users;
    
    users[index].isBlocked = !users[index].isBlocked;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
};

export const deleteUser = (userId: string): User[] => {
  const users = getAllUsers();
  const newUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  return newUsers;
};