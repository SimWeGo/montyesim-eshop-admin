import { alpha } from "@mui/system";

export const DrawerTheme = ({ theme }) => {
  return {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRight: `1px solid ${theme.palette.divider}`,
          width: 280,
          display: "flex",
          fontWeight: 700,
          flexDirection: "column",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: alpha(theme.palette.common.white, 0.1),
            borderRadius: "4px",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          "&:hover": {
            backgroundColor:
              theme.palette.background.hover ||
              alpha(theme.palette.primary.main, 0.09),
          },
          "&.Mui-selected": {
            color: theme.palette.common.white,
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: theme.palette.secondary.main,
          minWidth: "40px",
          display: "flex",
          justifyContent: "center",
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 600,
          color: theme.palette.text.primary,
        },
      },
    },
  };
};
