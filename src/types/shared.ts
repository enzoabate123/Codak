export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'player';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'import';
  entityType: 'character' | 'weapon' | 'class' | 'attachment' | 'ammo' | 'lore_rule' | 'system' | 'user' | 'ability';
  entityId: string;
  entityName?: string;
  details?: string;
}
