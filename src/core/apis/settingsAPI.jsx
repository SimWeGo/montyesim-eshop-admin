import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllSettings = async ({ page, pageSize } = {}) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("app_config")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (typeof page === "number" && typeof pageSize === "number") {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const updateSettings = async (
  payload,
  data,
  deletedItems,
  user,
  isDirty
) => {
  try {
    const forbidden_countries_data = data?.find(
      (el) => el?.key == "FORBIDDEN_COUNTRIES"
    );

    const cache_key_data = data?.find((el) => el?.key == "APP_CACHE_KEY");
    const new_forbidden_countries = payload?.find(
      (el) => el?.key == "FORBIDDEN_COUNTRIES"
    );
    const new_cache_key = payload?.find((el) => el?.key == "APP_CACHE_KEY");
    const res = await api(() => {
      let query = supabase
        .from("app_config")
        .upsert(payload, { onConflict: "key" });

      return query;
    });

    if (!res?.error) {
      // if (isDirty) {
      //   await api(() => {
      //     return supabase.from("audit_log").insert([
      //       {
      //         table_name: "app_config",
      //         old_data: JSON.stringify(data),
      //         new_data: JSON.stringify(payload),
      //         changed_by: user?.user_info?.id,
      //         operation: "UPDATE",
      //       },
      //     ]);
      //   });
      // }

      // Perform delete
      await api(() => {
        return supabase.from("app_config").delete().in("key", deletedItems);
      });

      if (
        new_forbidden_countries?.value !== forbidden_countries_data?.value &&
        new_cache_key?.value == cache_key_data?.value
      ) {
        const newUuid = crypto.randomUUID();
        const { error: updateError } = await supabase
          .from("app_config")
          .update({ value: newUuid })
          .eq("key", "APP_CACHE_KEY");
      }
    }

    return res;
  } catch (error) {
    throw error;
  }
};

export const getAllSettingsLogs = async ({ page, pageSize }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    // Step 1: Fetch orders
    const dataRes = await api(() => {
      let query = supabase
        .from("audit_log")
        .select("*", { count: "exact" })
        .eq("table_name", "app_config")
        .order("changed_at", { ascending: false });

      query = query.range(from, to);

      return query;
    });

    const userIds = [
      ...new Set(dataRes.data.map((order) => order?.changed_by)),
    ];

    // Step 3: Fetch user_copy info
    const { data: users, error } = await supabase
      .from("users_copy")
      .select("id,metadata")
      .in("id", userIds);

    if (error) throw error;

    // Step 4: Merge user info into orders
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const enrichedRes = dataRes.data.map((row) => ({
      ...row,
      user: userMap[row.changed_by] || null,
    }));

    return {
      ...dataRes,
      data: enrichedRes,
    };
  } catch (error) {
    throw error;
  }
};
