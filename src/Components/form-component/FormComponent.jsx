import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  Autocomplete,
  Avatar,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import AvatarEditorComponent from "../shared/avatar-editor/AvatarEditorComponent";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "./FormComponent.scss";

export const FormInput = (props) => {
  const {
    variant,
    onClick,
    startAdornment,
    placeholder,
    onChange,
    helperText,
    disabled,
    label = "",
    endAdornment,
    value,
    type = "text",
  } = props;

  return (
    <TextField
      className={props.className}
      fullWidth
      onClick={onClick}
      value={value ?? ""}
      placeholder={placeholder}
      type={type}
      label={label || ""}
      variant={variant}
      onChange={(e) => onChange(e.target.value)}
      helperText={helperText}
      disabled={disabled}
      slotProps={{
        input: {
          startAdornment: startAdornment ? (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ) : null,
          endAdornment: endAdornment ? (
            <InputAdornment position="end">{endAdornment}</InputAdornment>
          ) : null,
          autoComplete: "new-password",
          form: {
            autoComplete: "off",
          },
        },
      }}
      size="small"
    />
  );
};

export const FormPassword = (props) => {
  const { placeholder, value, onChange, startAdornment, helperText } = props;

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleOnChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="form-input-wrapper">
      <TextField
        fullWidth
        autoComplete="new-password"
        size="small"
        placeholder={placeholder}
        variant="outlined"
        type={showPassword ? "text" : "password"}
        onChange={handleOnChange}
        value={value}
        helperText={helperText}
        slotProps={{
          input: {
            autoComplete: "new-password",
            form: {
              autoComplete: "off",
            },
            startAdornment: startAdornment ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : null,
            endAdornment: (
              <InputAdornment position={"end"}>
                <IconButton onClick={handleClickShowPassword}>
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon />
                  ) : (
                    <RemoveRedEyeOutlinedIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </div>
  );
};

export const FormDropdownList = (props) => {
  const {
    data,
    noOptionsText,
    loading,
    onChange,
    helperText,
    accessName,
    accessValue = "id",
  } = props;
  const { placeholder, variant, disabled, required } = props;
  const { value } = props;

  const [val, setVal] = useState(null);
  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <Autocomplete
      size="small"
      disabled={disabled}
      fullWidth
      disableClearable={required}
      ListboxProps={{ style: { maxHeight: 200, overflow: "auto" } }}
      getOptionLabel={(option) => option?.[accessName]}
      options={data}
      value={val}
      isOptionEqualToValue={(option, value) =>
        option?.[accessValue] == value?.[accessValue]
      }
      loadingText={"Loading"}
      noOptionsText={noOptionsText}
      loading={loading}
      onChange={(event, selected) => {
        if (!disabled) {
          onChange(selected);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          placeholder={placeholder}
          helperText={helperText}
          disabled={disabled}
          InputProps={{
            ...params.InputProps,
            autocomplete: "new-password",
            form: {
              autocomplete: "off",
            },
            endAdornment: (
              <React.Fragment>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};

export const FormAvatarEditor = (props) => {
  const { value, name, onChange } = props;
  const [open, setOpen] = useState(false);

  let passedValue = null;
  if (value) {
    if (value instanceof Blob) {
      passedValue = URL.createObjectURL(value);
    } else {
      passedValue = `${value}`;
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={
          "cursor-pointer border border-gray-200 rounded-2xl h-[38px] flex flex-row justify-between gap-[0.5rem] p-1 items-center min-w-[200px] "
        }
      >
        {value ? (
          <div className={"flex flex-row gap-[0.5rem] min-w-0"}>
            <Avatar
              src={
                value instanceof Blob ? URL.createObjectURL(value) : `${value}`
              }
              sx={{ width: 24, height: 24 }}
              alt={name || "tag-name"}
            />
            <p className={"min-w-0 truncate"}>
              {value instanceof Blob ? name : value?.split("/")?.pop()}
            </p>
          </div>
        ) : (
          <p>Upload an Icon</p>
        )}
        <IconButton>
          {value ? (
            <ChangeCircleIcon fontSize="small" onClick={() => setOpen(true)} />
          ) : (
            <FileUploadIcon fontSize="small" onClick={() => setOpen(true)} />
          )}
        </IconButton>
      </div>
      {open && (
        <AvatarEditorComponent
          value={passedValue}
          onClose={() => setOpen(false)}
          updateImage={(value) => onChange(value)}
        />
      )}
    </>
  );
};
export const FormPaginationDropdownList = (props) => {
  const {
    value,
    placeholder,
    data,
    disabled,
    noOptionsText,
    loading,
    onChange,
    accessName,

    helperText,
    accessValue,
    handleResetData,
  } = props;

  const [inputValue, setInputValue] = useState("");
  const handleOnChange = (selected) => {
    onChange(selected);
    if (!selected) {
      setInputValue("");
      handleResetData(false, "");
    }
  };

  const handleScroll = async (event) => {
    const target = event.target;
    if (
      target.scrollHeight - target.scrollTop === target.clientHeight &&
      data?.page < data?.total
    ) {
      handleResetData(true, inputValue);
    }
  };
  const debouncedFilterOption = useDebouncedCallback(
    // function
    (value) => {
      handleResetData(false, value);
    },
    // delay in ms
    500
  );

  return (
    <Autocomplete
      size="small"
      disabled={disabled ? disabled : false}
      fullWidth
      onInputChange={(event, newInputValue, reason) => {
        if (reason === "input") {
          setInputValue(newInputValue);
          debouncedFilterOption(newInputValue);
        }
      }}
      onClose={() => setInputValue("")} // Reset inputValue when the dropdown is closed
      disableClearable={false}
      ListboxProps={{
        onScroll: handleScroll,
        style: { maxHeight: 200 },
      }}
      getOptionLabel={(option) => option?.[accessName]}
      options={data?.data || []}
      value={value}
      filterOptions={(options) => options}
      isOptionEqualToValue={(option, value) =>
        option?.[accessValue] === value?.[accessValue]
      }
      loadingText={"Loading"}
      noOptionsText={noOptionsText}
      loading={loading}
      onChange={(event, selected) => {
        handleOnChange(selected);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};

export const FormDateRange = (props) => {
  const { value, onChange, disabled, helperText, placeholder } = props;

  const startDate = value?.[0] ? new Date(value?.[0]) : null;
  const endDate = value?.[1] ? new Date(value?.[1]) : null;

  const handleDateChange = (dates) => {
    const [start, end] = dates;

    onChange([
      start ? dayjs(start).format("YYYY-MM-DD") : null,
      end ? dayjs(end).format("YYYY-MM-DD") : null,
    ]);
  };

  return (
    <div className="form-date-picker">
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        wrapperClassName="react-date-range-picker"
        placeholderText={placeholder}
        onChange={(update) => {
          handleDateChange(update);
        }}
        disabled={disabled}
        isClearable={disabled ? false : true}
      />
      {helperText !== "" && (
        <FormControl>
          <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
      )}
    </div>
  );
};

export const FormDate = (props) => {
  const {
    variant,
    onClick,
    startAdornment,
    placeholder,
    onChange,
    helperText,
    disabled,
    endAdornment,
    value,
    className,
  } = props;

  const inputRef = useRef(null);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    inputRef.current?.showPicker?.();
  };

  return (
    <TextField
      className={`${className} date-input`}
      fullWidth
      inputRef={inputRef}
      value={value ?? ""}
      placeholder={placeholder}
      type="date"
      variant={variant}
      onClick={handleClick}
      onChange={(e) => onChange(e.target.value)}
      helperText={helperText}
      disabled={disabled}
      size="small"
      InputProps={{
        startAdornment: startAdornment && (
          <InputAdornment position="start">{startAdornment}</InputAdornment>
        ),
        endAdornment: endAdornment && (
          <InputAdornment position="end">{endAdornment}</InputAdornment>
        ),
        sx: { cursor: "pointer" },
      }}
      inputProps={{
        autoComplete: "new-password",
      }}
    />
  );
};
