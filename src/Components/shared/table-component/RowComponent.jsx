//UTILITIES
import { useMemo, useState } from "react";
//COMPONENT
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";

//CSS

export function RowComponent(props) {
  const { handleHover, onAdd, onEdit, onDelete, onView } = props;
  const {
    row,
    keyProps,
    children,
    actions,
    collapseComponent,
    colSpan,
    openCollapse,
  } = props;
  //VARIABLES

  const open = useMemo(() => {
    return openCollapse;
  }, [openCollapse]);
  //FUNCTIONS

  return (
    <>
      <TableRow
        className={handleHover ? "cursor-pointer tableRow" : "tableRow"}
        hover={handleHover}
        onClick={handleHover ? (e) => handleHover(row?.id) : null}
        key={keyProps ? keyProps : row?.id}
      >
        {children}

        {actions && (
          <TableCell
            className={"whitespace-nowrap"}
            align={"right"}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {onAdd && (
              <IconButton
                icon={<AddIcon className="editIcon" />}
                onClick={() => {
                  onAdd(row);
                }}
              />
            )}

            {onEdit && (
              <Tooltip title={"Edit"} placement={"top"}>
                <IconButton
                  color="primary"
                  aria-label="edit"
                  onClick={(event) => {
                    onEdit(row);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title={"Delete"} placement={"top"}>
                <IconButton
                  color="error"
                  aria-label="delete"
                  onClick={(event) => {
                    onDelete(row);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {onView && (
              <Tooltip title={"View Detail"} placement={"top"}>
                <IconButton
                  color="primary"
                  aria-label="view"
                  onClick={(event) => {
                    onView(row);
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </TableCell>
        )}
      </TableRow>
      {open && (
        <TableRow key={`${keyProps || row?.id}-collapse`}>
          <TableCell colSpan={colSpan}>
            <Collapse in={open} timeout={"auto"} unmountOnExit>
              {collapseComponent}
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default RowComponent;
