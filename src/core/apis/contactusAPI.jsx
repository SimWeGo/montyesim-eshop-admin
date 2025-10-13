import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllMessages = async ({ page, pageSize, name }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const res = await api(() => {
      let query = supabase
        .from("contact_us")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (name?.trim()) {
        query = query.ilike("email", `%${name}%`);
      }

      query = query.range(from, to);

      return query;
    });

    return res;
  } catch (error) {
    console.error("error in getAllMessages:", error);
    throw error;
  }
};
