// Máximo de miembros por grupo (límite de la consulta `in` de Firestore)
export const MAX_GROUP_MEMBERS = 30;

// UIDs con permisos de administrador (pueden editar resultados a mano).
// Tu UID se ve en Firestore → users, o en groups → ownerId de un grupo que creaste.
export const ADMIN_UIDS: string[] = [
  'TwCRSVcvY6UlVV2AERlwdCOxBa33',
];

export function isAdmin(uid: string | undefined | null): boolean {
  return uid != null && ADMIN_UIDS.includes(uid);
}
