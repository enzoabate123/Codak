import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'player';
  createdAt: string;
  lastLoginAt?: string;
}

import { PublicUser } from '@/types/shared';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'compendium');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash, salt, ...publicUser } = user;
  return publicUser;
}

export function getStoredUsers(): StoredUser[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    // Initialize with default admin account: admin / admin
    const defaultSalt = crypto.randomBytes(16).toString('hex');
    const defaultAdmin: StoredUser = {
      id: 'usr-admin',
      username: 'admin',
      displayName: 'Comandante Geral',
      salt: defaultSalt,
      passwordHash: hashPassword('admin', defaultSalt),
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    const initial = [defaultAdmin];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler users.json:', err);
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function findUserByUsername(username: string): StoredUser | undefined {
  const users = getStoredUsers();
  return users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  const users = getStoredUsers();
  return users.find((u) => u.id === id);
}

export function verifyUserCredentials(username: string, password: string): PublicUser | null {
  const user = findUserByUsername(username);
  if (!user) return null;

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return null;
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();
  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
    saveStoredUsers(users);
  }

  return toPublicUser(user);
}

export function registerNewUser(
  username: string,
  displayName: string,
  password: string,
  role: 'admin' | 'player' = 'player'
): { user?: PublicUser; error?: string } {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { error: 'O nome de usuário deve ter pelo menos 3 caracteres.' };
  }
  if (!password || password.length < 3) {
    return { error: 'A senha deve ter pelo menos 3 caracteres.' };
  }

  const existing = findUserByUsername(cleanUsername);
  if (existing) {
    return { error: 'Este nome de usuário já está em uso.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${crypto.randomUUID()}`,
    username: cleanUsername,
    displayName: displayName.trim() || cleanUsername,
    salt,
    passwordHash: hashPassword(password, salt),
    role,
    createdAt: new Date().toISOString(),
  };

  const users = getStoredUsers();
  users.push(newUser);
  saveStoredUsers(users);

  return { user: toPublicUser(newUser) };
}

export function updateUserRole(userId: string, newRole: 'admin' | 'player'): boolean {
  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return false;

  // Prevent demoting last admin
  if (newRole === 'player' && users[idx].role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      return false; // Can't demote the only admin
    }
  }

  users[idx].role = newRole;
  saveStoredUsers(users);
  return true;
}

export function resetUserPassword(userId: string, newPassword: string): boolean {
  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return false;

  const salt = crypto.randomBytes(16).toString('hex');
  users[idx].salt = salt;
  users[idx].passwordHash = hashPassword(newPassword, salt);
  saveStoredUsers(users);
  return true;
}

export function deleteUser(userId: string): boolean {
  const users = getStoredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  if (user.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) return false; // Can't delete the only admin
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveStoredUsers(filtered);
  return true;
}
