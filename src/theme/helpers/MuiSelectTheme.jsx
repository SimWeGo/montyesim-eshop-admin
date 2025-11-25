import { alpha } from "@mui/system";

export const SelectTheme = ({ theme }) => {
  return {
    styleOverrides: {
      root: {
        borderRadius: "16px",
        backgroundColor: theme.palette.background.paper,
        "& .MuiOutlinedInput-root": {
          backgroundColor: theme.palette.background.paper,
          borderRadius: "16px",
        },
        "& .MuiInputLabel-root": {
          color: theme.palette.secondary.main,
          fontWeight: 500,
        },
        "& .MuiInputLabel-root.Mui-focused": {
          fontWeight: 600,
        },
      },
      select: {
        color: theme.palette.text.secondary,
      },
      icon: {
        color: theme.palette.text.secondary,
      },
      menu: {
        backgroundColor: theme.palette.background.paper,
      },
      paper: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.secondary,
      },
    },
  };
};
