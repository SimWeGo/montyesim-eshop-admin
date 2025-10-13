import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllPromotions = async (
  page,
  pageSize,
  name,
  rules,
  bundles
) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const res = await api(() => {
      let query = supabase.from("promotion").select(
        `*, promotion_rule(
         *,
         promotion_rule_action(id, name),
         promotion_rule_event(id, name)
       )`,
        { count: "exact" }
      );

      if (name?.trim()) {
        query = query.or(`name.ilike.%${name}%,code.ilike.%${name}%`);
      }

      if (rules?.length !== 0) {
        query = query.in("rule_id", rules);
      }

      if (bundles?.trim()) {
        const bundleList = bundles?.split(",").map((b) => b.trim());
        const bundleConditions = bundleList.map(
          (code) => `bundle_code.ilike.%${code}%`
        );

        bundleConditions.push("bundle_code.is.null");
        query = query.or(bundleConditions.join(","));
      }

      query = query.range(from, to).order("created_at", { ascending: false });

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const togglePromotionStatus = async ({ id, currentValue }) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("promotion")
        .update({ is_active: !currentValue })
        .eq("id", id)
        .select();

      return query;
    });
    return res;
  } catch (error) {
    throw error;
  }
};

export const AddPromotion = async (payload) => {
  try {
    const res = await api(async () => {
      // Proceed to insert promotion
      const insertResponse = await supabase
        .from("promotion")
        .insert([payload])
        .select();

      if (!insertResponse || insertResponse.error) {
        throw insertResponse.error;
      }

      return insertResponse.data;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const editPromotion = async (payload) => {
  try {
    const { id, ...payloadWithoutId } = payload;

    const { data, error } = await api(() => {
      return supabase
        .from("promotion")
        .select("id")
        .eq("id", payload?.id)
        .maybeSingle();
    });

    if (!data || data?.length === 0) {
      throw new Error("Invalid Promotion ID");
    } else if (error) {
      throw error;
    } else {
      const res = await api(async () => {
        const bundleCodes = payload?.bundle_code || "";

        const editPromotionRes = await supabase
          .from("promotion")
          .update({
            name: payload?.name,
            bundle_code: bundleCodes,
          })
          .eq("id", payload?.id)
          .select();

        if (!editPromotionRes || editPromotionRes.error) {
          throw editPromotionRes?.error;
        }

        return editPromotionRes.data;
      });

      return res;
    }
  } catch (error) {
    throw error;
  }
};

export const deletePromotion = async (promoCode) => {
  const fetchRes = await api(() => {
    let query = supabase
      .from("promotion_usage")
      .select("*, promotion(code)")
      .eq("promotion_code", promoCode);
    return query;
  });

  if (fetchRes?.error) return fetchRes;

  if (fetchRes?.data && fetchRes?.data?.length > 0) {
    throw new Error(
      "This promotion cannot be deleted because it is already linked to a transaction"
    );
  }

  const res = await api(() => {
    let query = supabase.from("promotion").delete().in("code", [promoCode]);

    return query;
  });

  return res;
};

export const checkNameUnique = async (payload, id) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("promotion")
        .select("id")
        .eq("name", payload)
        .limit(1);

      if (id) {
        query = query.neq("id", id);
      }

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const checkCodeUnique = async (payload, id) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("promotion")
        .select("id")
        .eq("code", payload)
        .limit(1);
      if (id) {
        query = query.neq("id", id);
      }
      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const getPromotionById = async (id) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("promotion")
        .select(
          "*,promotion_rule(*,promotion_rule_action(*),promotion_rule_event(*))",
          { count: "exact" }
        )

        .eq("id", id)
        .order("created_at", {
          referencedTable: "promotion_rule",
          ascending: false,
        })
        .single();

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const getAllPromotionsUsage = async (
  page,
  pageSize,
  name,
  user,
  bundles
) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    // Step 1: Fetch orders
    const promotionRes = await api(() => {
      let query = supabase
        .from("promotion_usage")
        .select(`*,promotion:promotion_code(code, id)`, { count: "exact" })
        .not("promotion_code", "is", null);

      if (name?.trim()) {
        query = query.or(`promotion_code.ilike.%${name}%`);
      }

      if (user) {
        query = query.eq("user_id", user);
      }

      if (bundles?.length > 0) {
        query = query.in("bundle_id", bundles);
      }

      query = query.range(from, to).order("created_at", { ascending: false });

      return query;
    });

    const userIds = [...new Set(promotionRes?.data.map((p) => p?.user_id))];

    // Step 3: Fetch user_copy info
    const { data: users, error } = await supabase
      .from("users_copy")
      .select("id,metadata")
      .in("id", userIds);

    if (error) throw error;

    // Step 4: Merge user info into orders
    const userMap = Object.fromEntries(users?.map((u) => [u.id, u]));

    const enrichedPromotion = promotionRes?.data?.map((p) => ({
      ...p,
      user: userMap[p?.user_id] || null,
    }));

    return {
      ...promotionRes,
      data: enrichedPromotion,
    };
  } catch (error) {
    throw error;
  }
};
