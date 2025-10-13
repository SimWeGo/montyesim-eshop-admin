import {
  Box,
  ListItemButton,
  ListItemText,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import { truncateText } from "../../../core/helpers/utilFunctions";

const ToolTipMenu = ({ item, IsActive }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  return (
    <Tooltip
      key={item.recordGuid}
      title={
        <Box
          sx={{
            padding: 0,
            border: 0,
          }}
        >
          {item.children.map((child) => (
            <ListItemButton
              key={child.recordGuid}
              to={`/${child.uri}`}
              component={Link}
              sx={{
                fontSize: "13px",
              }}
            >
              <i className={`fa ${child.iconUri} menu-icon`} />
              <ListItemText
                className="px-3"
                sx={{
                  fontWeight: IsActive(child) ? 700 : 400,
                }}
                primary={truncateText(child.menuDetail[0]?.name, 20)}
              />
            </ListItemButton>
          ))}
        </Box>
      }
      placement="right"
      arrow
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: "inherit",
            "&hover": {
              color: "black",
            },
            boxShadow: "none",
            border: "none",
          },
        },
      }}
    >
      <ListItemButton
        sx={{
          backgroundColor: "transparent",
          "&:hover": {},
          paddingY: 2,
          marginBottom: "1px",
          justifyContent: "center",
        }}
      >
        <i
          className={`fa ${item.iconUri} menu-icon`}
          style={{
            fontSize: "17px",
            "&:hover": {
              color: primaryColor,
            },

            color: IsActive(item)
              ? theme.palette.secondary.main
              : theme.palette.primary.main,
          }}
        />
      </ListItemButton>
    </Tooltip>
  );
};

export default ToolTipMenu;
