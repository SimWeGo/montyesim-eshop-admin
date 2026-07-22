import { customizeError } from "../helpers/customizeError";
import { refreshSessionWithRole } from "../helpers/sessionRefresh";

export const api = async (callback) => {
  let { data, error, status, count } = await callback();

  // Token expiré ou non autorisé → refresh puis retry UNE fois
  if (status === 401 || (error && error?.message?.includes("JWT expired"))) {
    // FIX (B2) : refreshSessionWithRole re-dispatch un user_info COMPLET
    // (rôle inclus). L'ancien code écrasait user_info avec sessionData.user
    // (sans is_admin/role) → PageNotFound sur toutes les pages gated après
    // le premier refresh de token.
    const session = await refreshSessionWithRole();

    if (!session) {
      // Refresh impossible : Redux déjà purgé par le helper (SignOut),
      // RouteWrapper redirige vers /signin au prochain render.
      throw new Error("Session expired. Logged out.");
    }

    // Retry de la requête d'origine après refresh (comportement historique
    // conservé : le retry retourne le résultat brut, sans customizeError)
    const retryResult = await callback();
    return retryResult;
  }

  // Erreurs transportées dans le corps d'un résultat RPC
  const rpcError = data?.error ?? null;

  return {
    data,
    error: customizeError(error) || rpcError || null,
    status,
    count,
  };
};
