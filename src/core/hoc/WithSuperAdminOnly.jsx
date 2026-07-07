import { useSelector } from "react-redux";
import PageNotFound from "../../Components/shared/fallbacks/page-not-found/PageNotFound";

// Pages/blocs ARGENT (D5, CDC §9.2) : réservés STRICTEMENT à super_admin.
// Le back re-vérifie (super_admin_only) — ce HOC n'est que de l'UX.
export function WithSuperAdminOnly({ children }) {
  const role = useSelector((state) => state.authentication?.user_info?.role);

  return role === "super_admin" ? children : <PageNotFound />;
}

// Hook compagnon : gater un BOUTON argent dans une page lecture
// (ex. Undo payout, Detach sub, Update network rate).
export function useIsSuperAdmin() {
  return useSelector(
    (state) => state.authentication?.user_info?.role === "super_admin"
  );
}
