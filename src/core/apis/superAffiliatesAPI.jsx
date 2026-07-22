import { restApi } from "./restInstance";

// ============================================================ Affiliés (§A7)
// Suffixe "Rest" : évite toute confusion avec de futurs modules Supabase
// direct — ce CRUD DOIT passer par monty-api (rôles D5 + logique §A5).

// Liste complète — PAS de pagination serveur : filtre/tranche côté client
export const getAllAffiliatesRest = () =>
  restApi((rest) => rest.get("/admin/affiliates"));

export const getAffiliateByIdRest = (id) =>
  restApi((rest) => rest.get(`/admin/affiliates/${id}`));

export const createAffiliateRest = (payload) =>
  restApi((rest) => rest.post("/admin/affiliates", payload));

export const updateAffiliateRest = (id, payload) =>
  restApi((rest) => rest.patch(`/admin/affiliates/${id}`, payload));

export const deactivateAffiliateRest = (id) =>
  restApi((rest) => rest.delete(`/admin/affiliates/${id}`));

// La clé retournée (data.api_key) n'est montrée qu'UNE fois — B9
export const regenerateAffiliateApiKey = (id) =>
  restApi((rest) => rest.post(`/admin/affiliates/${id}/regenerate-api-key`));

// Sortie de revue post-détachement (CDC §8.6) — super_admin
export const clearRateReview = (id, payload) =>
  restApi((rest) =>
    rest.post(`/admin/affiliates/${id}/clear-rate-review`, payload)
  );

// ======================================================== Super-affiliés (§A6)

export const getAllSuperAffiliates = () =>
  restApi((rest) => rest.get("/admin/super-affiliates"));

export const createSuperAffiliate = (payload) =>
  restApi((rest) => rest.post("/admin/super-affiliates", payload));

export const getSuperAffiliateById = (superId) =>
  restApi((rest) => rest.get(`/admin/super-affiliates/${superId}`));

export const attachSub = (superId, payload) =>
  restApi((rest) =>
    rest.post(`/admin/super-affiliates/${superId}/attach`, payload)
  );

export const detachSub = (superId, subId) =>
  restApi((rest) =>
    rest.post(`/admin/super-affiliates/${superId}/detach/${subId}`)
  );

// 422 SPLIT_EXCEEDS_NETWORK_RATE → res.errorCode + res.data.conflicts (§A6)
export const updateNetworkRate = (superId, payload) =>
  restApi((rest) =>
    rest.patch(`/admin/super-affiliates/${superId}/network-rate`, payload)
  );

// GET /admin/super-affiliates/payouts (S5, monty-api 075f5b2) — historique
// paginé SERVEUR des payouts SimWeGo→super. admin_only (lecture).
// Réponse : List[SuperPayoutDTO] {id, super_affiliate_id, super_name (join),
// total_amount_cents, sub_commissions_amount_cents,
// super_margin_amount_cents, entry_count, currency, status
// 'paid'|'cancelled', payment_method, payment_reference, paid_at, notes,
// created_at} — totalCount = nb total de lignes (→ res.count).
export const getSuperPayouts = ({ superId = null, page = 0, pageSize = 10 }) =>
  restApi((rest) =>
    rest.get("/admin/super-affiliates/payouts", {
      params: { super_id: superId || undefined, page, page_size: pageSize },
    })
  );

// ---- Affiliés DIRECTS (sans réseau) — « marquer payé » (2026-07-22) ----
// GET /admin/payouts/independents/pending → List[IndependentWithPendingDTO]
// { affiliate_id, name, is_active, commission_rate, pending_amount_cents,
//   entry_count, currency, currency_count, oldest_entry_at }
export const getIndependentsPending = () =>
  restApi((rest) => rest.get("/admin/payouts/independents/pending"));

// POST /admin/payouts/independents/{id} → 200 SuperPayoutDTO | 204 rien à payer
export const createIndependentPayout = (affiliateId, payload = {}) =>
  restApi((rest) =>
    rest.post(`/admin/payouts/independents/${affiliateId}`, payload)
  );

// ================================================== Payouts (admin_payouts.py)
// ⚠️ Contrats RÉELS Sprint 3 (divergent de l'annexe §A6) — router
// /admin/payouts/*, TOUT super_admin_only, montants en CENTIMES.

// GET /admin/payouts/pending → List[SuperWithPendingDTO]
// { super_affiliate_id, name, is_active, network_commission_rate, sub_count,
//   pending_amount_cents, entry_count, currency, currency_count,
//   oldest_entry_at } — currency_count > 1 ⇒ la génération échouera (409)
export const getPendingNetworks = () =>
  restApi((rest) => rest.get("/admin/payouts/pending"));

// GET /admin/payouts/super-affiliates/{super_id}/pending → PendingAmountDTO
// { super_affiliate_id, entry_count, pending_amount_cents,
//   sub_commissions_cents, super_margin_cents, currency, currency_count,
//   oldest_entry_at, newest_entry_at } — MÊME prédicat que le claim du RPC
export const getSuperPendingAmount = (superId) =>
  restApi((rest) =>
    rest.get(`/admin/payouts/super-affiliates/${superId}/pending`)
  );

// POST /admin/payouts/super-affiliates/{super_id} (claim-all S+M)
// body { payment_method?, payment_reference?, paid_at?, notes? }
// → 200 Response[SuperPayoutDTO] OU 204 sans corps si rien à payer
// (res.status === 204) ; 409 PAYOUT_MIXED_CURRENCIES ; 404
// SUPER_AFFILIATE_NOT_FOUND
export const createSuperPayout = (superId, payload) =>
  restApi((rest) =>
    rest.post(`/admin/payouts/super-affiliates/${superId}`, payload)
  );

// POST /admin/payouts/super/{payout_id}/undo → Response[UndoPayoutResponse]
// { payout_id, restored_entries } ; 409 PAYOUT_ALREADY_UNDONE ; 404
// PAYOUT_NOT_FOUND
export const undoSuperPayout = (payoutId) =>
  restApi((rest) => rest.post(`/admin/payouts/super/${payoutId}/undo`));

// POST /admin/payouts/sub/{payout_id}/undo — annule un mark-paid super→sub
export const undoSubPayout = (payoutId) =>
  restApi((rest) => rest.post(`/admin/payouts/sub/${payoutId}/undo`));
