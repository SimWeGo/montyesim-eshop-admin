import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import PageNotFound from "../../Components/shared/fallbacks/page-not-found/PageNotFound";
import { useLocation } from "react-router-dom";

export function WithSuperAdmins({ children }) {
  const { pathname } = useLocation();
  const user = useSelector((state) => state.authentication);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isSuperAdmin = user?.user_info?.email
      ?.toLowerCase()
      .includes("superadmin");
    setAuthorized(isSuperAdmin || false);
  }, [pathname, user]);

  if (!authorized) {
    return <PageNotFound />;
  }

  return children;
}
