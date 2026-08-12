export const Permission = {
  DocumentRead: 'document:read',
  DocumentCreate: 'document:create',
  DocumentDelete: 'document:delete',
  AiQuery: 'ai:query',
  TenantAdmin: 'tenant:admin',
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

export type Principal = {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
};
