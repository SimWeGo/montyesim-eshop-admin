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

export const updateSettings = async (payload) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("app_config")
        .upsert(payload, { onConflict: "key" });

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};
