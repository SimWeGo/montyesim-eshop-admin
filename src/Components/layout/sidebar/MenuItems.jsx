import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  Box,
  Collapse,
  ListItemButton,
  ListItemText,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import { truncateText } from "../../../core/helpers/utilFunctions";

const MenuItems = ({
  item,
  level = 0,
  hasChildren,
  toggleMenu,
  isClickable,
  IsActive,
  getStyles,
  open,
  openMenus,
  renderMenu,
}) => {
  const theme = useTheme();

  const getFontSize = (level) => `${14 - level * 2}px`;

  const handleClick = () => {
    if (hasChildren) toggleMenu(item.recordGuid);
  };

  return (
    <div key={item.recordGuid} style={{ marginLeft: level * 20 }}>
      <ListItemButton
        onClick={handleClick}
        to={isClickable ? `/${item.uri}` : undefined}
        component={isClickable ? Link : "div"}
        sx={{
          marginY: 0,
          color: IsActive(item)
            ? theme.palette.secondary.main
            : theme.palette.primary.main,
          ...getStyles(level),
          marginBottom: "1px",
          display: "flex",
          alignItems: "center",
          fontSize: getFontSize(level),
          fontWeight: 700,
          justifyContent: open ? "flex-start" : "center",
        }}
      >
        <i
          className={`fa ${item.iconUri} menu-icon`}
          style={{
            color: IsActive(item)
              ? theme.palette.secondary.main
              : theme.palette.primary.main,
            fontSize: getFontSize(level),
            marginRight: open ? "10px" : "0",
          }}
        />

        {open && (
          <ListItemText
            primary={truncateText(item.menuDetail[0]?.name, 20)}
            sx={{
              "& .MuiListItemText-primary": {
                color: IsActive(item)
                  ? theme.palette.secondary.main
                  : theme.palette.primary.main,
              },
            }}
          />
        )}

        {open &&
          hasChildren &&
          (openMenus[item.recordGuid] ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={openMenus[item.recordGuid]} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2 }}>{renderMenu(item.children, level + 1)}</Box>
        </Collapse>
      )}
    </div>
  );
};

export default MenuItems;
