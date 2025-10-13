import { alpha } from "@mui/system";

export const TabsTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";

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
          backgroundColor: isDarkMode
            ? theme.palette.common.white
            : theme.palette.primary.main,
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
          color: isDarkMode
            ? theme.palette.text.secondary
            : theme.palette.text.primary, // ✅ Fixes dark mode text
          "&.Mui-selected": {
            color: isDarkMode
              ? theme.palette.text.primary
              : theme.palette.primary.main, // ✅ Highlights selected tab
          },
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1), // ✅ Adds hover effect
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
