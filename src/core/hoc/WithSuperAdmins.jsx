import { useSelector } from "react-redux";
import PageNotFound from "../../Components/shared/fallbacks/page-not-found/PageNotFound";

export function WithSuperAdmins({ children }) {
  const isAdmin = useSelector(
    (state) => state.authentication?.user_info?.is_admin === true
  );

  return isAdmin ? children : <PageNotFound />;
}
