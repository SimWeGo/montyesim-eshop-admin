import { SignIn } from "../../Redux/reducers/AuthReducer";
import { store } from "../../Redux/store";
import { customizeError } from "../helpers/customizeError";
import supabase from "./supabase";

export const api = async (callback) => {
  let { data, error, status, count } = await callback();

  // If token expired or unauthorized
  if (status === 401 || (error && error?.message?.includes("JWT expired"))) {
    // Try to refresh the session
    const { data: sessionData, error: refreshError } =
      await supabase.auth.refreshSession();

    if (refreshError) {
      // Could not refresh, log out or redirect
      await supabase.auth.signOut();
      throw new Error("Session expired. Logged out.");
    }
    store.dispatch(
      SignIn({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        user_info: sessionData.user,
      })
    );

    // Retry the original request after refresh
    const retryResult = await callback();
    return retryResult;
  }

  // Check for errors inside RPC result

  const rpcError = data?.error ?? null;

  return {
    data,
    error: customizeError(error) || rpcError || null,
    status,
    count,
  };
};
