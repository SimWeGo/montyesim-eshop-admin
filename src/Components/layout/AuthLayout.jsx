import React, { useMemo } from "react";

import MuiSideNavigation from "./sidebar/MuiSideNavigation ";
import { Box, CssBaseline, IconButton } from "@mui/material";
import TopNav from "./TopNav";
import useRouteName from "../../core/hooks/useRouteName";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";

const AuthLayout = ({ children }) => {
  const routeName = useRouteName();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const routeLength = useMemo(() => {
    return pathname?.split("/")?.length;
  }, [routeName]);
  return (
    <Box sx={{ display: "flex", flexFlow: "row nowrap", gap: "2px" }}>
      <CssBaseline />

      <MuiSideNavigation />
      <TopNav />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          overflow: "hidden",
          overflowY: "auto",
        }}
      >
        <div className="mt-[80px] p-2 h-[calc(100vh-80px)]">
          <div className={"flex flex-row items-center mb-2"}>
            {routeLength > 2 && (
              <IconButton onClick={() => navigate(-1)}>
                <ArrowBackIosIcon fontSize="small" color="primary" />
              </IconButton>
            )}
            <h1>{routeName}</h1>
          </div>
          {children}
        </div>
      </Box>
    </Box>
  );
};

export default AuthLayout;
