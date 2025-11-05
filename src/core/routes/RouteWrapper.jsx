import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import MainLayout from "../../Components/layout/MainLayout";
import AuthLayout from "../../Components/layout/AuthLayout";

const RouteWrapper = ({
  shouldbeLoggedIn,
  element,
  isPrivate,
  isAuthRestricted,
}) => {
  const { isAuthenticated } = useSelector((state) => state.authentication);

  const [open, setOpen] = useState(true);
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  if (shouldbeLoggedIn && !isAuthenticated) {
    return (
      <Navigate
        to={
          location?.pathname
            ? `/signin?next=${encodeURIComponent(location.pathname)}`
            : "signin"
        }
        replace
      />
    );
  } else if (!shouldbeLoggedIn && isAuthenticated) {
    return <Navigate to={next ? decodeURIComponent(next) : "/users"} />;
  }

  const Layout = isAuthenticated ? AuthLayout : MainLayout;

  return (
    <Layout
      isPublic={!isPrivate && !isAuthRestricted}
      isAuthRestricted={isAuthRestricted}
      open={open}
      setOpen={setOpen}
    >
      <Outlet />
    </Layout>
  );
};

export default RouteWrapper;
