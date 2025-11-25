import { FormHelperText, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/datepicker.scss";

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  dateFormat = "dd/MM/yyyy",
  error = null,
  disabled = false,
  minDate = null,
  maxDate = null,
}) {
  const theme = useTheme();

  let className;

  if (error) {
    className = "date-picker-error";
  } else {
    className = "date-picker-light";
  }

  return (
    <Grid item xs={12} sm={6} className={className}>
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat={dateFormat}
        placeholderText={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
      />

      {error && (
        <FormHelperText className="helper-text">{error}</FormHelperText>
      )}
    </Grid>
  );
}
