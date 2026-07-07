import { useSelector } from "react-redux";
import PageNotFound from "../../Components/shared/fallbacks/page-not-found/PageNotFound";
import { ADMIN_ROLES } from "../helpers/sessionRefresh";

// Colonne users_copy.role (Sprint 5) — admin OU super_admin.
// NB : malgré son nom historique, ce HOC gate les pages "admin only" ;
// la barrière stricte super_admin est WithSuperAdminOnly.
export function WithSuperAdmins({ children }) {
  const role = useSelector((state) => state.authentication?.user_info?.role);

  return ADMIN_ROLES.includes(role) ? children : <PageNotFound />;
}
