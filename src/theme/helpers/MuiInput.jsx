import { alpha } from "@mui/system";

export const InputTheme = ({ theme }) => {
  return {
    styleOverrides: {
      root: {
        borderRadius: "8px",
        "& .MuiOutlinedInput-root": {
          backgroundColor: theme.palette.background.paper,
          borderRadius: "16px",
        },
        "& .MuiInputLabel-root": {
          fontWeight: 500,
        },
        "& .MuiInputLabel-root.Mui-focused": {
          fontWeight: 600,
        },
      },
      input: {
        color: theme.palette.text.secondary,
        "&:-webkit-autofill": {
          WebkitBoxShadow: "0 0 0px 1000px transparent inset !important",
          backgroundColor: "transparent !important",
          color: "inherit !important",
        },
      },
      paper: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.secondary,
      },
    },
  };
};
