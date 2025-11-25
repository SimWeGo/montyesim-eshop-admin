import MenuIcon from "@mui/icons-material/Menu";
import { Box, Drawer, IconButton, List, useMediaQuery } from "@mui/material";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { MenuRoutes } from "../../../core/routes/Pages";
import { toggleSidebar } from "../../../Redux/reducers/SidebarReducer";
import IconImage from "../../shared/icon-image/IconImage";
import MenuItems from "./MenuItems";
import MuiDrawerHeader from "./MuiDrawerHeader";
import ToolTipMenu from "./ToolTipMenu";

const drawerWidthOpen = 250;
const drawerWidthClosed = 90;

const MuiSideNavigation = () => {
  const open = useSelector((state) => state.sidebar?.open);
  const isSmall = useMediaQuery("(max-width: 1024px)");
  const dispatch = useDispatch();

  const user = useSelector((state) => state.authentication);
  const location = useLocation();
  const pathName = location.pathname;
  const [openMenus, setOpenMenus] = useState(() => {
    const savedMenus = localStorage.getItem("openMenus");
    return savedMenus ? JSON.parse(savedMenus) : {};
  });

  const toggleMenu = useCallback((guid) => {
    setOpenMenus((prev) => {
      const newOpenMenus = {};
      if (!prev[guid]) {
        newOpenMenus[guid] = true;
      }
      localStorage.setItem("openMenus", JSON.stringify(newOpenMenus));
      return newOpenMenus;
    });
  }, []);

  const getStyles = (level) => ({
    padding: `${6 - level * 5}px 14px !important`,
    fontSize: `${14 - parseInt(level) * 1}px !important`,
    borderRadius: "0px",
  });
  const IsActive = (item) => {
    if (pathName === "/" && item?.uri === "users") return true;
    return (
      pathName.includes(`/${item?.uri}`) ||
      item?.children?.some((child) => pathName.includes(`/${child?.uri}`))
    );
  };

  const renderMenu = (items, level = 0) =>
    items?.map((item, index) => {
      const hasChildren = item?.children?.length > 0;
      const isClickable = !hasChildren;
      if (!open && hasChildren) {
        return (
          <ToolTipMenu
            key={index}
            item={item}
            IsActive={IsActive}
            toggleMenu={toggleMenu}
          />
        );
      }

      return item?.superAdminAccess &&
        !user?.user_info?.email?.toLowerCase()?.includes("superadmin") ? (
        ""
      ) : (
        <MenuItems
          key={item?.recordGuid || index}
          item={item}
          level={level}
          hasChildren={hasChildren}
          toggleMenu={toggleMenu}
          isClickable={isClickable}
          IsActive={IsActive}
          getStyles={getStyles}
          open={open}
          openMenus={openMenus}
          renderMenu={renderMenu}
        />
      );
    });

  return (
    <Drawer
      variant={isSmall ? null : "persistent"}
      open={isSmall ? open : true}
      anchor="left"
      sx={{
        width: open ? drawerWidthOpen : drawerWidthClosed,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? drawerWidthOpen : drawerWidthClosed,
          transition: "width 0.3s",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: !open ? "center" : "",
        },
      }}
    >
      <MuiDrawerHeader>
        {open ? (
          <div
            className={
              "flex flex-row justify-between gap-[0.5rem] items-center w-full"
            }
          >
            <IconImage />

            <IconButton
              onClick={() => {
                dispatch(toggleSidebar());
              }}
            >
              <MenuIcon fontSize="medium" color="primary" />{" "}
            </IconButton>
          </div>
        ) : (
          <IconButton
            onClick={() => {
              dispatch(toggleSidebar());
            }}
          >
            <MenuIcon fontSize="medium" color="primary" />{" "}
          </IconButton>
        )}{" "}
      </MuiDrawerHeader>{" "}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {MenuRoutes.length > 0 && <List>{renderMenu(MenuRoutes)}</List>}{" "}
      </Box>{" "}
    </Drawer>
  );
};
export default MuiSideNavigation;
