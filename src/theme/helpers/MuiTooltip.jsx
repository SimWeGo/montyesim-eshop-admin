export const TooltipTheme = ({ theme }) => {
  return {
    styleOverrides: {
      tooltip: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.secondary,
        border: "none",
        boxShadow: "none",
      },
      arrow: {
        color: theme.palette.background.default,
      },
    },
  };
};
