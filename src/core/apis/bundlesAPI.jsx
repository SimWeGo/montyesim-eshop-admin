import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllBundles = async (page, pageSize, name, tags) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    if (name?.trim() === "" && tags?.length === 0) {
      const res = await api(() => {
        let query = supabase.from("bundle").select("*", { count: "exact" });
        query = query.range(from, to).order("created_at", { ascending: false });

        return query;
      });

      return res;
    } else {
      const res = await api(() => {
        let query = supabase.rpc("search_bundles", {
          p_page: page,
          p_page_size: pageSize,
          p_search_term: name?.trim(),
          p_tag_ids: tags,
        });

        return query;
      });
      return {
        data: res?.data?.items,
        count: res?.data?.total_count,
        error: res?.error,
      };
    }
  } catch (error) {
    console.error("error in getAllBundles:", error);
    throw error;
  }
};

export const toggleBundleStatus = async ({ id, currentValue }) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("bundle")
        .update({ is_active: !currentValue })
        .eq("id", id)
        .select();

      return query;
    });

    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "APP_CACHE_KEY")
      .single();

    if (!error) {
      const newUuid = crypto.randomUUID();
      const { error: updateError } = await supabase
        .from("app_config")
        .update({ value: newUuid })
        .eq("key", "APP_CACHE_KEY");
    }

    return res;
  } catch (error) {
    console.error("error in toggleBundleStatus:", error);
    throw error;
  }
};
export const updateBundleTitle = async (payload) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("bundle")
        .update({ bundle_name: payload?.bundle_name })
        .eq("id", payload?.id)
        .select();

      return query;
    });

    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "APP_CACHE_KEY")
      .single();

    if (!error) {
      const newUuid = crypto.randomUUID();
      const { error: updateError } = await supabase
        .from("app_config")
        .update({ value: newUuid })
        .eq("key", "APP_CACHE_KEY");
    }

    return res;
  } catch (error) {
    console.error("error in updateBundleTitle:", error);
    throw error;
  }
};

export const getBundleTagsAndGroups = async (bundleId) => {
  try {
    if (!bundleId) {
      throw new Error("Bundle ID is required");
    }
    const bundleRes = await api(() => {
      let query = supabase
        .from("bundle")
        .select("bundle_name")
        .eq("id", bundleId)
        .single();

      return query;
    });

    if (bundleRes?.error) {
      return bundleRes;
    }

    const tagRes = await api(() => {
      return supabase
        .from("bundle_tag")
        .select(
          `
          id,
          tag:tag_id (
            id,
            name,
            icon,
            tag_group:tag_group_id (
              id,
              name,
              type,
              group_category
            )
          )
        `
        )
        .eq("bundle_id", bundleId);
    });

    return {
      bundleName: bundleRes?.data?.bundle_name || null,
      data: tagRes?.data || null,
      error: tagRes?.error || bundleRes?.error,
    };
  } catch (error) {
    console.error("error in getBundleTagsAndGroups:", error);
    throw error;
  }
};

export const assignTagsToBundle = async (bundleId, tagIds) => {
  if (!bundleId || !Array.isArray(tagIds)) {
    throw new Error("Invalid bundleId or tagIds");
  }

  const insertData = tagIds.map((tagId) => ({
    bundle_id: bundleId,
    tag_id: tagId,
    is_active: true,
  }));

  // 1. Upsert selected tags
  const upsertRes = await api(() => {
    let query = supabase.from("bundle_tag").upsert(insertData, {
      onConflict: ["bundle_id", "tag_id"],
    });

    return query;
  });
  if (upsertRes?.error) {
    console.error("Error upserting tags:", upsertRes?.error);
    return upsertRes;
  }

  console.log(tagIds, "ALL THE TAG IDS");
  // 2. Delete relations not in the selected list
  const deleteRes = await api(() => {
    let query = supabase
      .from("bundle_tag")
      .delete()
      .eq("bundle_id", bundleId)
      .not("tag_id", "in", `(${tagIds.join(",")})`);
    return query;
  });

  //update cache key
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "APP_CACHE_KEY")
    .single();

  if (!error) {
    const newUuid = crypto.randomUUID();
    const { error: updateError } = await supabase
      .from("app_config")
      .update({ value: newUuid })
      .eq("key", "APP_CACHE_KEY");
  }

  return { error: deleteRes?.error || upsertRes?.error };
};

export const getAllBundlesDropdown = async ({
  page = 1,
  pageSize = 10,
  search = "",
} = {}) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const res = await api(() => {
      let query = supabase.from("bundle").select(`data`, { count: "exact" });
      if (search.trim() !== "") {
        query = query.ilike("data->>bundle_code", `%${search}%`);
      }

      query = query.range(from, to).order("created_at", { ascending: false });
      return query;
    });
    return res;
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
};
