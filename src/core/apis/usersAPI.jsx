import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllUsers = async ({ page, pageSize, name }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const res = await api(() => {
      let query = supabase.from("users_copy").select("*", { count: "exact" });

      if (name?.trim()) {
        query = query.ilike("email", `%${name}%`);
      }

      query = query.range(from, to);

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const getAllUsersDropdown = async ({
  page = 1,
  pageSize = 10,
  name = "",
} = {}) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const res = await api(() => {
      let query = supabase
        .from("users_copy")
        .select("id, email, metadata")
        .not("email", "eq", null);
      if (name.trim() !== "") {
        query = query.or(`email.ilike.%${name}%`);
      }

      query = query.range(from, to).order("email", { ascending: true });
      return query;
    });
    return res;
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
};

export const userSignout = async () => {
  api(() => supabase.auth.signOut())
    .then((result) => {
      return result;
    })
    .catch((err) => {
      throw err;
    });
};
export const getAllReferralTransactions = async (
  page,
  pageSize,
  id,
  search,
  from_user,
  referral_date
) => {
  console.log(from_user, referral_date);
  const offset = page * pageSize;

  const { data, error } = await supabase.rpc(
    "get_referral_transactions_with_count",
    {
      p_user_id: id,
      p_limit: pageSize,
      p_offset: offset,
      p_search: search,
      p_from_email: from_user,
      p_referral_date: referral_date,
    }
  );

  if (error) throw error;

  const parsed = data;

  return {
    data: parsed.data,
    count: parsed.count,
    total: parsed.total,
  };
};

export const getAllWalletTransactions = async (
  page,
  pageSize,
  userId = null
) => {
  const offset = page * pageSize;

  const { data, error } = await supabase.rpc(
    "get_wallet_transactions_with_count",
    {
      p_user_id: userId,
      p_limit: pageSize,
      p_offset: offset,
    }
  );

  if (error) throw error;

  const parsed = data;

  return {
    data: parsed.data || [],
    count: parsed.count || 0,
    total: parsed.total || 0,
  };
};
