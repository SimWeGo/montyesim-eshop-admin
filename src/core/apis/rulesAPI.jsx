import { escapeIlikeValue } from "../helpers/utilFunctions";
import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllRules = async ({ page, pageSize, name, action, event }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    /*EXPLANATION: I created a new SQL view that casts the id to text to enable filtering using partial matches*/
    const res = await api(() => {
      let query = supabase.from("promotion_rule").select(
        `*,
    promotion_rule_action (
      id,name
    ),
    promotion_rule_event(
     id,name
    )
  `,
        { count: "exact" }
      );
      if (name?.trim()) {
        query = query.ilike("id_text", `%${name}%`);
      }
      if (action !== null) {
        query = query.eq("promotion_rule_action_id", action);
      }
      if (event !== null) {
        query = query.eq("promotion_rule_event_id", event);
      }
      query = query.range(from, to).order("created_at", { ascending: false });

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const getAllRulesDropdown = async ({
  page = 1,
  pageSize = 10,
  search = "",
} = {}) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const res = await api(() => {
      let query = supabase.from("promotion_rule").select(
        `*,
          promotion_rule_action(id, name),
          promotion_rule_event(id, name)`,
        { count: "exact" }
      );
      if (search.trim() !== "") {
        query = query.ilike(`name`, `%${search}%`);
      }
      query = query.range(from, to).order("created_at", { ascending: false });
      return query;
    });
    return res;
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
};

export const getAllActions = async () => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("promotion_rule_action")
        .select(`*`, { count: "exact" });

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const getAllEvents = async () => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("promotion_rule_event")
        .select(`*`, { count: "exact" });

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const AddRule = async (payload) => {
  try {
    const matchyItem = {
      promotion_rule_action_id: payload?.promotion_rule_action_id,
      promotion_rule_event_id: payload?.promotion_rule_event_id,
      max_usage: payload?.max_usage,
    };

    const existing = await api(() => {
      let query = supabase
        .from("promotion_rule")
        .select("promotion_rule_action_id,promotion_rule_event_id,max_usage")
        .match(matchyItem);
      return query;
    });

    if (!existing?.error) {
      if (existing?.data?.length === 0) {
        const res = await api(() => {
          let query = supabase.from("promotion_rule").insert([payload]);

          return query;
        });

        return res;
      } else {
        throw new Error(
          "A rule with the same action, event, and usage limit already exists."
        );
      }
    } else {
      return existing;
    }
  } catch (error) {
    throw error;
  }
};

export const deleteRule = async (ruleId) => {
  const fetchRes = await api(() => {
    let query = supabase
      .from("promotion")
      .select("*, promotion_rule(id)")
      .eq("rule_id", ruleId);
    return query;
  });

  if (fetchRes?.error) return fetchRes;

  if (fetchRes?.data && fetchRes?.data?.length > 0) {
    throw new Error(
      "This rule cannot be deleted because it is already linked to an existing promotion"
    );
  }

  const res = await api(() => {
    let query = supabase.from("promotion_rule").delete().in("id", [ruleId]);

    return query;
  });

  return res;
};

export const editRule = async (payload) => {
  try {
    const { id, ...payloadWithoutId } = payload;
    const matchyItem = {
      promotion_rule_action_id: payload?.promotion_rule_action_id,
      promotion_rule_event_id: payload?.promotion_rule_event_id,
      max_usage: payload?.max_usage,
    };

    const existing = await api(() => {
      let query = supabase
        .from("promotion_rule")
        .select("promotion_rule_action_id,promotion_rule_event_id,max_usage")
        .match(matchyItem)
        .not("id", "eq", id);
      return query;
    });

    if (!existing?.error) {
      if (existing?.data?.length === 0) {
        const res = await api(() => {
          let query = supabase
            .from("promotion_rule")
            .update(payloadWithoutId)
            .eq("id", payload?.id);

          return query;
        });

        return res;
      } else {
        throw new Error(
          "A rule with the same action, event, and usage limit already exists."
        );
      }
    } else {
      return existing;
    }
  } catch (error) {
    throw error;
  }
};
