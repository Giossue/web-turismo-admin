"use client";

import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useId, useState, type ReactNode } from "react";

import {
  DeleteRecordAction,
  type DeleteRecordActionProps,
} from "@/components/admin/delete-record-action";

type RecordMenuAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: "error" | "success";
};

type RecordActionsMenuProps = {
  subject: string;
  tabIndex?: number;
  actions: readonly RecordMenuAction[];
  deletion?: Omit<DeleteRecordActionProps, "renderTrigger">;
};

/** Un único acceso por fila; los diálogos quedan fuera del popover. */
export function RecordActionsMenu({
  subject,
  tabIndex,
  actions,
  deletion,
}: RecordActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const id = useId();
  const open = Boolean(anchorEl);

  function renderMenu(deleteTrigger?: { onClick: () => void; disabled: boolean }) {
    return (
      <>
        <IconButton
          id={`${id}-trigger`}
          aria-label={`Acciones de ${subject}`}
          aria-haspopup="menu"
          aria-controls={open ? `${id}-menu` : undefined}
          aria-expanded={open ? true : undefined}
          tabIndex={tabIndex}
          onClick={(event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
          }}
          sx={{
            border: 0,
            backgroundColor: "transparent",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <MoreVertRounded fontSize="small" />
        </IconButton>
        <Menu
          id={`${id}-menu`}
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            list: { "aria-labelledby": `${id}-trigger`, dense: true },
            paper: { sx: { minWidth: 190, maxWidth: "calc(100vw - 32px)" } },
          }}
        >
          {actions.map((action) => (
            <MenuItem
              key={action.label}
              disabled={action.disabled}
              onClick={() => {
                setAnchorEl(null);
                action.onClick();
              }}
              sx={action.color ? { color: `${action.color}.main` } : undefined}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{action.icon}</ListItemIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
          {deleteTrigger && actions.length > 0 ? <Divider /> : null}
          {deleteTrigger ? (
            <MenuItem
              disabled={deleteTrigger.disabled}
              onClick={() => {
                setAnchorEl(null);
                deleteTrigger.onClick();
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <DeleteOutlineRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MenuItem>
          ) : null}
        </Menu>
      </>
    );
  }

  if (deletion) {
    return <DeleteRecordAction {...deletion} renderTrigger={renderMenu} />;
  }
  return renderMenu();
}
