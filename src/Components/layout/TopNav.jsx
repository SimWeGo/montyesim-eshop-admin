import { KeyboardDoubleArrowRight } from "@mui/icons-material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import clsx from "clsx";
import { useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { userSignout } from "../../core/apis/usersAPI";
import useRouteName from "../../core/hooks/useRouteName";
import { SignOut } from "../../Redux/reducers/AuthReducer";
import { toast } from "react-toastify";

export default function TopNav({ setOpenSide }) {
  const isSmall = useMediaQuery("(max-width: 1024px)");

  const { isAuthenticated } = useSelector((state) => state.authentication);
  const theme = useTheme();
  const dispatch = useDispatch();
  const routeName = useRouteName();
  const navigate = useNavigate();
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  // Handle menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await userSignout().then((res) => {
      if (res?.error) {
        toast.error("Failed to signout");
      } else {
        dispatch(SignOut());
      }
    });
  };

  return (
    <Box
      className={clsx("w-full shadow-md sm:p-4  h-[80px]", {
        ["rounded-xl"]: isAuthenticated,
      })}
      sx={{ backgroundColor: theme.palette.background.paper }}
    >
      <div className="flex items-center w-full h-[100%]">
        {isAuthenticated && isSmall && (
          <Tooltip title="Open Menu">
            <IconButton
              onClick={() => {
                setOpenSide((prev) => !prev);
                localStorage.setItem("MenuOpen", !open);
              }}
            >
              <KeyboardDoubleArrowRight fontSize="medium" color="primary" />{" "}
            </IconButton>
          </Tooltip>
        )}
        {isAuthenticated ? (
          <Typography variant="h6" className="font-semibold truncate">
            {routeName}
          </Typography>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="flex items-center"
          >
            <LazyLoadImage
              alt={import.meta.env.VITE_APP_PROJECT_TITLE}
              src={"/logo/logo.png"}
              className="h-full w-auto object-cover"
            />
          </button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <IconButton onClick={handleMenuOpen}>
              <AccountCircleIcon fontSize="medium" color="primary" />
            </IconButton>
          )}
        </div>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onMouseLeave={handleMenuClose} // Close on mouse leave
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleSignOut}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
