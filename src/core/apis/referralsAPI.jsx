import { api } from "./apiInstance";
import supabase from "./supabase";

export const exportReferralsData = async (
  user,
  search,
  from_user,
  referral_date
) => {
  const res = await api(() => {
    let query = supabase.rpc("export_referrals_data", {
      p_user_id: user || null,
      p_search: search?.trim() || null,
      p_from_email: from_user?.trim() || null,
      p_referral_date: referral_date || null,
    });
    return query;
  });

  return {
    referrals: res.data?.referrals || [],
  };
};
