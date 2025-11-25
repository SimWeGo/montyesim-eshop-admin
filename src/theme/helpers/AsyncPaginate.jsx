import zIndex from "@mui/material/styles/zIndex";
import { alpha } from "@mui/system";

export const AsyncPaginateTheme = ({ theme }) => {
  return {
    control: (base, state) => ({
      ...base,
      cursor: "pointer",
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      minHeight: "35px",
      borderRadius: "16px",
      border: `1px solid ${
        state.isFocused ? theme.palette.primary.main : theme.palette.divider
      }`,
      boxShadow: state.isFocused
        ? `0px 0px 5px ${alpha(theme.palette.primary.main, 0.2)}`
        : "none",
      transition: "all 0.3s ease",
      borderColor: "#c8c4c4",
      "&:hover": {
        borderColor: theme.palette.primary.main,
      },
      input: {
        color: "black",
        zIndex: 9999,
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme.palette.background.default,
      borderRadius: "8px",
      border: `1px solid ${theme.palette.divider}`,
      zIndex: 9999,
      position: "absolute",
    }),
    option: (base, { isFocused, isSelected }) => {
      let backgroundColor = "transparent";

      if (isSelected) {
        backgroundColor = alpha(theme.palette.primary.main, 0.4);
      } else if (isFocused) {
        backgroundColor = alpha(theme.palette.primary.main, 0.2);
      }

      return {
        ...base,
        backgroundColor,
        padding: "10px",
        borderRadius: "16px",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      };
    },

    singleValue: (base, state) => ({
      ...base,
      color: state.isDisabled
        ? "rgb(149, 156, 169)"
        : theme.palette.text.primary,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: theme.palette.text.secondary,
      "&:hover": {
        color: alpha(theme.palette.primary.main, 0.5),
      },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "transparent",
    }),
    input: (base) => ({
      ...base,
      color: "black",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      borderRadius: "12px",
      padding: "2px 6px",
      display: "flex",
      alignItems: "center",
    }),
    multiValueLabel: (base) => ({
      ...base,

      color: theme.palette.primary.main,
      fontWeight: 500,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: theme.palette.primary.main,
      cursor: "pointer",
      ":hover": {
        color: theme.palette.primary.main,
      },
    }),
  };
};
