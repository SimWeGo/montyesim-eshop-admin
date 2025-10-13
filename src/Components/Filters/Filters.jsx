import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Button,
  Collapse,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useState } from "react";

export default function Filters({
  children,
  onApply = () => {},
  onReset = () => {},
  applyButtonName = "Apply",
  applyDisable = false,
  resetButtonName = "Reset",
  filterStyles = {
    borderRadius: "16px",
  },
  filterButtons = null,
}) {
  const [toggleFilter, setToggleFilter] = useState(true);
  const theme = useTheme();
  return (
    <Grid
      container
      size={{ xs: 12 }}
      sx={{
        ...filterStyles,
        backgroundColor: theme.palette.background.default,
        padding: 2,

        width: "100%",
      }}
    >
      <Grid container size={12} className="flex items-center gap-2">
        <IconButton onClick={() => setToggleFilter(!toggleFilter)}>
          <FilterListIcon className="" />
        </IconButton>

        <Typography className="font-semibold">Filters</Typography>
      </Grid>

      <Collapse in={toggleFilter} sx={{ width: "100%" }}>
        <Grid container size={{ xs: 12, sm: 12, md: 12 }} className="my-3">
          {children}
        </Grid>
        <Grid size={{ xs: 12 }} className="flex justify-end gap-3 ">
          {filterButtons || (
            <>
              <Button variant="outlined" onClick={onReset}>
                {resetButtonName}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onApply}
                disabled={applyDisable}
              >
                {applyButtonName}
              </Button>
            </>
          )}
        </Grid>
      </Collapse>
    </Grid>
  );
}
