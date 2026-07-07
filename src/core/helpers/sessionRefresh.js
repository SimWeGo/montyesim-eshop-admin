import { SignIn, SignOut } from "../../Redux/reducers/AuthReducer";
import { store } from "../../Redux/store";
import supabase from "../apis/supabase";

// Rôles admis dans l'app admin — colonne users_copy.role (migration
// 2026-07-03_add_user_role.sql). is_admin est ABANDONNÉ côté front (B5/B6) :
// c'était l'une des 2 sources du split-brain de rôles.
export const ADMIN_ROLES = ["admin", "super_admin"];

/**
 * Relit le rôle applicatif depuis users_copy (source de vérité).
 * Retourne null si introuvable ou en erreur — l'appelant décide quoi faire.
 */
export const fetchUserRole = async (userId) => {
  const { data, error } = await supabase
    .from("users_copy")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data?.role ?? null;
};

/**
 * FIX BUG REFRESH RÔLE (§0.1) : refresh de session + re-fetch du rôle +
 * re-dispatch d'un user_info COMPLET. Jamais de dispatch d'un user_info
 * sans rôle : c'est précisément le bug d'origine.
 *
 * Retourne la session fraîche, ou null si le refresh échoue (Redux est
 * alors purgé : RouteWrapper redirigera vers /signin au prochain render).
 */
export const refreshSessionWithRole = async () => {
  const { data: sessionData, error: refreshError } =
    await supabase.auth.refreshSession();

  if (refreshError || !sessionData?.session) {
    await supabase.auth.signOut();
    store.dispatch(SignOut());
    return null;
  }

  const role = await fetchUserRole(sessionData.user.id);

  store.dispatch(
    SignIn({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user_info: { ...sessionData.user, role },
    })
  );

  return sessionData.session;
};
