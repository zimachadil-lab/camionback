/**
 * TEMPORARY: Role normalization during migration period
 * 
 * Production database accepts: 'transporter', 'coordinateur'
 * Frontend/code uses: 'transporteur', 'coordinator'
 * 
 * This module provides helpers to normalize roles in both directions:
 * - toDbRole: Convert frontend role to database role (transporteur → transporter)
 * - fromDbRole: Convert database role to frontend role (transporter → transporteur)
 */

export type FrontendRole = 'client' | 'transporteur' | 'coordinator' | 'admin' | null;
export type DbRole = 'client' | 'transporter' | 'coordinator' | 'admin' | null;

/**
 * Convert frontend role to database role for writing to DB
 * transporteur → transporter
 * coordinator → coordinator (unchanged)
 */
export function toDbRole(frontendRole: FrontendRole): DbRole {
  if (frontendRole === 'transporteur') return 'transporter';
  return frontendRole as DbRole;
}

/**
 * Convert database role to frontend role for reading from DB
 * transporter → transporteur
 * coordinateur → coordinator (legacy)
 */
export function fromDbRole(dbRole: DbRole | string | null): FrontendRole {
  if (dbRole === 'transporter') return 'transporteur';
  if (dbRole === 'coordinateur') return 'coordinator';
  return dbRole as FrontendRole;
}

/**
 * Check if a user has a specific role (handles both formats)
 * Usage: hasRole(user.role, 'transporteur') // works with both 'transporter' and 'transporteur'
 */
export function hasRole(userRole: string | null | undefined, expectedRole: FrontendRole): boolean {
  if (!userRole || !expectedRole) return false;
  const normalizedUserRole = fromDbRole(userRole);
  return normalizedUserRole === expectedRole;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRole: string | null | undefined, expectedRoles: FrontendRole[]): boolean {
  if (!userRole) return false;
  return expectedRoles.some(role => hasRole(userRole, role));
}
