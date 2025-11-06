import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllSettings = async () => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("app_config")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const updateSettings = async (payload, data, deletedItems) => {
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
