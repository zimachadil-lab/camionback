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

export type FrontendRole = 'client' | 'transporteur' | 'coordinateur' | 'admin' | null;
export type DbRole = 'client' | 'transporter' | 'coordinateur' | 'admin' | null;

/**
 * Convert frontend role to database role for writing to DB
 * transporteur → transporteur (DB migration complete)
 * coordinateur → coordinateur (unchanged after migration)
 */
export function toDbRole(frontendRole: FrontendRole): DbRole {
  // After migration, DB uses 'transporteur' and 'coordinateur'
  // No conversion needed anymore
  return frontendRole as DbRole;
}

/**
 * Convert database role to frontend role for reading from DB
 * transporter → transporteur
 * coordinator → coordinateur (updated after migration)
 */
export function fromDbRole(dbRole: DbRole | string | null): FrontendRole {
  if (dbRole === 'transporter') return 'transporteur';
  if (dbRole === 'coordinator') return 'coordinateur';
  // After migration, DB uses 'coordinateur' - keep it as-is
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
