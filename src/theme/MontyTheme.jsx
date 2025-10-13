import PropTypes from "prop-types";
import GlobalStyles from "@mui/material/GlobalStyles";
import { alpha, ThemeProvider, createTheme } from "@mui/material/styles";
import { memo, useEffect, useLayoutEffect } from "react";
import { CssBaseline } from "@mui/material";
import { ButtonTheme } from "./helpers/MuiButton";
import { IconTheme } from "./helpers/MuiIcons";
import { InputTheme } from "./helpers/MuiInput";
import { DrawerTheme } from "./helpers/MuiDrawer";
import { TableTheme } from "./helpers/MuiTable";
import { DataGridTheme } from "./helpers/MuiDataGrid";
import { CardTheme } from "./helpers/MuiCard";
import { TabsTheme } from "./helpers/MuiTabs";
import { AsyncPaginateTheme } from "./helpers/AsyncPaginate";
import { SelectTheme } from "./helpers/MuiSelectTheme";
import { DatePickerTheme } from "./helpers/DatePickerTheme";
import { TooltipTheme } from "./helpers/MuiTooltip";
import { AccordionTheme } from "./helpers/AccordionTheme";

const useEnhancedEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const inputGlobalStyles = (theme) => (
  <GlobalStyles
    styles={{
      html: {
        backgroundColor: `${theme.palette.background.default}!important`,
        color: `${theme.palette.text.primary}!important`,
        fontFamily: '"DM Sans", sans-serif',
      },
      body: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflowY: "auto",
      },
      "::-webkit-scrollbar": {
        width: "8px",
      },
      "::-webkit-scrollbar:horizontal": {
        height: "8px",
      },
      "::-webkit-scrollbar-track": {
        background: alpha(theme.palette.background.default, 0.1),
        borderRadius: "4px",
      },
      "::-webkit-scrollbar-thumb": {
        background: alpha(
          theme.palette.mode === "light" ? "#000000" : "#FFFFFF",
          0.24
        ),
        borderRadius: "4px",
      },
      "::-webkit-scrollbar-thumb:hover": {
        background: alpha(
          theme.palette.mode === "light" ? "#000000" : "#FFFFFF",
          0.37
        ),
      },
      "table.simple tbody tr th": {
        borderColor: theme.palette.divider,
      },
      "table.simple thead tr th": {
        borderColor: theme.palette.divider,
      },
      "a:not([role=button]):not(.MuiButtonBase-root)": {
        color: theme.palette.secondary.main,
        textDecoration: "underline",
      },
      "a.link, a:not([role=button])[target=_blank]": {
        background: alpha(theme.palette.secondary.main, 0.2),
        color: "inherit",
        borderBottom: `1px solid ${theme.palette.divider}`,
        textDecoration: "none",
        "&:hover": {
          background: alpha(theme.palette.secondary.main, 0.3),
          textDecoration: "none",
        },
      },
      '[class^="border"], [class*="border"], [class*="divide-"] > :not([hidden]) ~ :not([hidden])':
        {
          borderColor: theme.palette.divider,
        },
      hr: {
        borderColor: theme.palette.divider,
      },
    }}
  />
);

function MontyTheme({ direction = "ltr", theme, children }) {
  const muiTheme = createTheme({
    ...theme,
    typography: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeightRegular: theme?.typography?.fontWeightRegular || 400,
      fontWeightMedium: theme?.typography?.fontWeightMedium || 500,
      fontWeightBold: theme?.typography?.fontWeightBold || 700,
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
            padding: "8px 8px",
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          inputRoot: {
            padding: "0px 8px",
          },
        },
      },

      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: "red",
            margin: "0",
            wordBreak: "break-word",
            "&.Mui-disabled": {
              color: "red",
            },
          },
        },
      },
      MuiButton: ButtonTheme({ theme }),
      MuiSvgIcon: IconTheme({ theme }),
      MuiTextField: InputTheme({ theme }),
      MuiCard: CardTheme({ theme }),
      MuiTabs: TabsTheme({ theme }).MuiTabs,
      MuiTab: TabsTheme({ theme }).MuiTab,
      MuiTabPanel: TabsTheme({ theme }).MuiTabPanel,
      MuiSelect: SelectTheme({ theme }),
      MuiTooltip: TooltipTheme({ theme }),
      ...DrawerTheme({ theme }),
      ...TableTheme({ theme }),
      ...DataGridTheme({ theme }),
      ...AccordionTheme({ theme }),
    },
    asyncPaginateStyles: AsyncPaginateTheme({ theme }),
    datePickerStyles: DatePickerTheme({ theme }),
  });

  useEnhancedEffect(() => {
    document.body.dir = direction;
  }, [direction]);

  useEffect(() => {
    document.body.classList.add(
      muiTheme.palette.mode === "light" ? "light" : "dark"
    );
    document.body.classList.remove(
      muiTheme.palette.mode === "light" ? "dark" : "light"
    );

    // **Set CSS Variables for All Palette Colors**
    const setCSSVariables = (prefix, obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === "object") {
          setCSSVariables(`${prefix}-${key}`, value);
        } else {
          document.documentElement.style.setProperty(
            `--mui-${prefix}-${key}`,
            value
          );
        }
      });
    };
    setCSSVariables("palette", muiTheme.palette);
  }, [muiTheme.palette, theme]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
      {inputGlobalStyles(muiTheme)}
    </ThemeProvider>
  );
}

// Add PropTypes validation
MontyTheme.propTypes = {
  direction: PropTypes.oneOf(["ltr", "rtl"]).isRequired,
  theme: PropTypes.object.isRequired,
  children: PropTypes.node,
};

export default memo(MontyTheme);
