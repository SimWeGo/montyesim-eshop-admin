import React from "react";
import { Route, Routes } from "react-router-dom";
import { privateRoutes, publicRoutes } from "./allRoutes";
import { WithSuperAdmins } from "../hoc/WithSuperAdmins";
import { WithSuperAdminOnly } from "../hoc/WithSuperAdminOnly";

const AppRouter = () => {
  console.log("mounted");
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
                  child?.superAdminOnly ? (
                    <WithSuperAdminOnly>{child.element}</WithSuperAdminOnly>
                  ) : child?.superAdminAccess ? (
                    <WithSuperAdmins>{child.element}</WithSuperAdmins>
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
              route?.superAdminOnly ? (
                <WithSuperAdminOnly>{route?.element}</WithSuperAdminOnly>
              ) : route?.superAdminAccess ? (
                <WithSuperAdmins>{route?.element}</WithSuperAdmins>
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
