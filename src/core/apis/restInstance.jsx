import axios from "axios";
import { refreshSessionWithRole } from "../helpers/sessionRefresh";
import supabase from "./supabase";

// Enveloppe monty-api (app/schemas/response.py) :
// { status, totalCount, data, title, message, developerMessage,
//   responseCode, errorCode }

const API_PREFIX = "/api/v1";

if (!import.meta.env.VITE_API_BASE_URL) {
  // Garde-fou : sans base URL, toutes les pages affiliation échoueront.
  // Vite inline cette variable au BUILD (cf. B1 — env Render du static site).
  console.error(
    "VITE_API_BASE_URL is not set — REST admin pages will not work"
  );
}

// Normalisation : la variable d'env peut porter ou non le préfixe /api/v1
// (elle le porte dans .env.simwego) — on ne l'ajoute que s'il manque.
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);
const baseURL = rawBaseUrl.endsWith(API_PREFIX)
  ? rawBaseUrl
  : `${rawBaseUrl}${API_PREFIX}`;

const restInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// --- Request : Authorization depuis la SESSION SUPABASE (source de vérité,
// PAS le token Redux — redux-persist peut réhydrater un token périmé).
restInstance.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response : 401 → refresh (rôle re-fetché, B2) + retry UNE seule fois.
// 403 n'est PAS retryé : depuis le fix main.py, le back distingue 401 (token)
// de 403 (rôle insuffisant).
restInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    if (error?.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const session = await refreshSessionWithRole();
      if (session) {
        original.headers.Authorization = `Bearer ${session.access_token}`;
        return restInstance(original);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Normalisation compatible avec le style des pages (cf. api() Supabase) :
 *   const res = await restApi((rest) => rest.get("/admin/affiliates"));
 *   if (res?.error) toast.error(res.error);
 *
 * - error     : message affichable (traduit par le back via Accept-Language)
 * - errorCode : identifiant machine-stable (ErrorMessages) — SEUL champ
 *               fiable pour brancher une logique front (CDC §9)
 * - data      : conservé même en erreur (422 network-rate → data.conflicts)
 * - status    : 204 = succès sans corps (ex. payout : rien à payer)
 */
export const restApi = async (callback) => {
  try {
    const response = await callback(restInstance);
    const body = response?.data;
    return {
      data: body?.data ?? null,
      count: body?.totalCount ?? 0,
      error: null,
      errorCode: body?.errorCode ?? null,
      status: response?.status ?? null,
    };
  } catch (error) {
    const body = error?.response?.data;
    return {
      data: body?.data ?? null,
      count: body?.totalCount ?? 0,
      error: body?.message || body?.title || error?.message || "Request failed",
      errorCode: body?.errorCode ?? null,
      status: error?.response?.status ?? null,
    };
  }
};

export default restInstance;
