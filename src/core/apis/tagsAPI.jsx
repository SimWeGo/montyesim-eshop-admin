import { api } from "./apiInstance";
import { cleanupTagUploadedIcons } from "./groupsAPI";
import supabase from "./supabase";

export const addTags = async (payload) => {
  try {
    const res = await api(() => {
      let query = supabase.from("tag").insert(
        payload?.tagsWithUploadedIcons?.map((el) => {
          return { ...el, tag_group_id: payload?.group_id };
        })
      );
      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const upsertTag = async (payload) => {
  try {
    const res = await api(() => {
      let query = supabase.from("tag").upsert(
        payload?.tagsWithUploadedIcons?.map((el) => {
          return { ...el, tag_group_id: parseInt(payload?.group_id) };
        })
      );
      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};
export const deleteTags = async (payload) => {
  const Ids = payload?.map((el) => el?.id);

  try {
    const res = await api(() => {
      let query = supabase.from("tag").delete().in("id", Ids);
      return query;
    });

    if (!res?.error) {
      cleanupTagUploadedIcons(payload);
    }

    return res;
  } catch (error) {
    throw error;
  }
};

export const getTagsByTagGroup = async (tagGroupId) => {
  try {
    if (!tagGroupId) throw new Error("Tag Group ID is required");

    const res = await supabase
      .from("tag")
      .select("*")
      .eq("tag_group_id", tagGroupId);

    if (res?.error) throw res?.error;

    return res;
  } catch (err) {
    throw err;
  }
};

export const getAllTags = async ({
  page = 1,
  pageSize = 10,
  name = "",
} = {}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("tag")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (name.trim()) {
      query = query.ilike("name", `%${name}%`);
    }

    const { data, error, count } = await query;
    return { data, error, count };
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
};

export const getAllBundleTags = async ({
  page = 1,
  pageSize = 10,
  search = "",
} = {}) => {
  try {
    const res = await api(() => {
      let query = supabase.rpc("get_tags_with_group_all", {
        search: search.trim(),
        page: page,
        page_size: pageSize,
      });
      return query;
    });

    return {
      data: res?.data?.items,
      count: res?.data?.total,
      error: res?.error,
    };
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
};
