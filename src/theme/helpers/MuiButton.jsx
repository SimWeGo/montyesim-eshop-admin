export const ButtonTheme = ({ theme }) => {
  return {
    styleOverrides: {
      root: {
        borderRadius: "100px",
        textTransform: "none",
        fontWeight: 600,
        padding: "8px 16px",
        transition: "all 0.3s ease",
      },
      containedPrimary: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common?.white || "#FFFFFF",
        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
      },
      containedSecondary: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.common?.white || "#FFFFFF",
        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
      },
      outlinedPrimary: {
        border: `2px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main,
      },
      outlinedSecondary: {
        border: `2px solid ${theme.palette.secondary.main}`,
        color: theme.palette.secondary.main,
      },
      textPrimary: {
        color: theme.palette.primary.main,
      },
      textSecondary: {
        color: theme.palette.secondary.main,
      },
    },
  };
};
