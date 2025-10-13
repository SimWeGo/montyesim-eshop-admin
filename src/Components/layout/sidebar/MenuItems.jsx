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
  level,
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

  const getFontSize = (level) => {
    const size = 14 - parseInt(level) * 10;
    const result = `${size}px`;
    return result;
  };
  return (
    <div key={item.recordGuid} style={{ marginLeft: level * 20 }}>
      <ListItemButton
        onClick={() => {
          if (hasChildren) toggleMenu(item.recordGuid);
        }}
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
          // borderLeft: IsActive(item) ? `5px solid ` : `5px solid transperant`,
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
            marginRight: "0px",
            paddingLeft: "3px",
            fontWeight: 600,
          }}
        />

        {open && (
          <ListItemText
            className="px-0"
            sx={{
              "& .MuiListItemText-primary": {
                color: IsActive(item) ? "secondary.main" : "primary.main",
              },
              "& .MuiListItemText-secondary": {
                color: IsActive(item) ? "secondary.main" : "primary.main",
              },
            }}
            primary={
              IsActive(item)
                ? truncateText(item.menuDetail[0]?.name, 20)
                : undefined
            }
            secondary={
              !IsActive(item)
                ? truncateText(item.menuDetail[0]?.name, 20)
                : undefined
            }
            primaryTypographyProps={{
              fontSize: getStyles(level).fontSize,
            }}
            secondaryTypographyProps={{ fontWeight: 600 }}
          />
        )}

        {open &&
          hasChildren &&
          (openMenus[item.recordGuid] ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={openMenus[item.recordGuid]} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 0 }}>{renderMenu(item.children, level + 1)}</Box>
        </Collapse>
      )}
    </div>
  );
};

export default MenuItems;
