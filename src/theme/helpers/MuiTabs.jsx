import { alpha } from "@mui/system";

export const TabsTheme = ({ theme }) => {
  return {
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: "48px",
          "& .MuiTab-root": {
            textTransform: "none",
          },
        },
        indicator: {
          backgroundColor: theme.palette.primary.main,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          minHeight: "48px",
          padding: "12px 16px",
          textTransform: "none",
          color: theme.palette.text.primary,
          "&.Mui-selected": {
            color: theme.palette.primary.main,
          },
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
        },
      },
    },
    MuiTabPanel: {
      styleOverrides: {
        root: {
          padding: "10px 0px",
        },
      },
    },
  };
};
