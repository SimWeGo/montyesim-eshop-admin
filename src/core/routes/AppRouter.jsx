import React from "react";
import { Route, Routes } from "react-router-dom";
import { privateRoutes, publicRoutes } from "./allRoutes";
import { WithSuperAdmin } from "../hoc/withSuperAdmin";

const AppRouter = () => {
  return (
    <Routes>
      {privateRoutes?.map((route) =>
        route?.children ? (
          <Route key={route.path} path={route.path} element={route.element}>
            {route.children.map((child) => (
              <Route
                index={child?.index}
                key={child.path}
                path={child.path}
                element={
                  child?.superAdminAccess ? (
                    <WithSuperAdmin>{child.element}</WithSuperAdmin>
                  ) : (
                    child.element
                  )
                }
              />
            ))}
          </Route>
        ) : (
          <Route
            key={route.path}
            index={route?.index}
            element={
              route?.superAdminAccess ? (
                <WithSuperAdmin>{route?.element}</WithSuperAdmin>
              ) : (
                route?.element
              )
            }
          />
        )
      )}

      {publicRoutes?.map((route) =>
        route?.children ? (
          <Route key={route.path} path={route.path} element={route.element}>
            {route.children.map((child) => (
              <Route
                index={child?.index}
                key={child.path}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ) : (
          <Route
            key={route.path}
            index={route?.index}
            element={route?.element}
          />
        )
      )}
    </Routes>
  );
};

export default AppRouter;
