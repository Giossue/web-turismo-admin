import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import {
  Box,
  IconButton,
  Stack,
  Table,
  TableContainer,
  Tooltip,
  Typography,
  type TableProps,
} from "@mui/material";

import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { webTokens } from "@/theme/tokens";

type AdminTableProps = Omit<TableProps, "aria-label" | "children"> & {
  ariaLabel: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  footer?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  minWidth?: number | string;
};

export function AdminTable({
  ariaLabel,
  children,
  empty = false,
  emptyMessage = "No hay información para mostrar.",
  footer,
  loading = false,
  loadingLabel = "Cargando información",
  minWidth,
  sx: tableSx,
  ...tableProps
}: AdminTableProps) {
  const showState = loading || empty;

  return (
    <FlatSurface sx={{ overflow: "hidden" }}>
      {showState ? (
        <ContentState
          status={loading ? "loading" : "empty"}
          label={loadingLabel}
          message={emptyMessage}
        />
      ) : (
        <TableContainer
          sx={{
            maxWidth: "100%",
            overflowX: "auto",
            "& > table": minWidth === undefined ? undefined : { minWidth },
          }}
        >
          <Table
            {...tableProps}
            aria-label={ariaLabel}
            size={tableProps.size ?? "medium"}
            sx={tableSx}
          >
            {children}
          </Table>
        </TableContainer>
      )}
      {footer}
    </FlatSurface>
  );
}

export function AdminTableFooter({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const lastPage = Math.max(Math.ceil(total / pageSize) - 1, 0);
  const firstResult = total === 0 ? 0 : page * pageSize + 1;
  const lastResult = Math.min((page + 1) * pageSize, total);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
      gap={webTokens.spacing.inline}
      sx={{
        p: webTokens.spacing.tableFooter,
        borderTop: "1px solid var(--mui-palette-divider)",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {total === 0 ? "0 resultados" : `${firstResult}–${lastResult} de ${total}`}
      </Typography>
      <Stack direction="row" alignSelf={{ xs: "flex-end", sm: "auto" }}>
        <Tooltip title="Página anterior">
          <span>
            <IconButton
              aria-label="Página anterior"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
            >
              <ChevronLeftRounded />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Página siguiente">
          <span>
            <IconButton
              aria-label="Página siguiente"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= lastPage}
            >
              <ChevronRightRounded />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

export function AdminTableToolbar({
  actions,
  children,
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      spacing={webTokens.spacing.control}
      alignItems={{ lg: "flex-end" }}
      justifyContent="space-between"
    >
      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>{children}</Box>
      {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
    </Stack>
  );
}
