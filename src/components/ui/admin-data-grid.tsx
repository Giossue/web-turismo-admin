"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import { Box, Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  DataGrid,
  FilterPanelTrigger,
  GridPanel,
  Toolbar,
  ToolbarButton,
  type DataGridProps,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";

import { ADMIN_TABLE_PAGE_SIZE, type AdminTablePagination } from "./admin-table";
import { ContentState } from "./content-state";
import { FlatSurface } from "./flat-surface";
import { SearchField } from "./search-field";

type GridSearch = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type AdminDataGridProps<R extends GridValidRowModel> = Pick<
  DataGridProps<R>,
  "rows" | "columns" | "getRowId" | "loading"
> & {
  ariaLabel: string;
  error: string | null;
  emptyMessage: string;
  pagination: AdminTablePagination;
  search?: GridSearch;
  filtering?: boolean;
  filterCount?: number;
  /** Filtros de dominio procesados por la API, independientes del modelo nativo. */
  filterPanel?: ReactNode;
};

type GridControls = Pick<
  AdminDataGridProps<GridValidRowModel>,
  "search" | "filterCount" | "filterPanel" | "emptyMessage" | "filtering" | "error"
>;

const GridControlsContext = createContext<GridControls>({
  emptyMessage: "Sin resultados",
  error: null,
});

const AdminGridPanel = styled(GridPanel)(({ theme }) => ({
  "& .MuiDataGrid-paper": {
    border: "1px solid",
    borderColor: (theme.vars ?? theme).palette.divider,
    backgroundColor: (theme.vars ?? theme).palette.background.paper,
    maxHeight: "min(640px, calc(100dvh - 32px))",
  },
}));

// Slots estables: cambiar los filtros no remonta el panel ni interrumpe el foco.
function AdminGridToolbar() {
  const { search, filtering, filterCount } = useContext(GridControlsContext);
  return (
    <Toolbar
      aria-label="Buscar y filtrar"
      render={
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        />
      }
    >
      {search ? (
        <Box sx={{ flex: "1 1 220px", minWidth: 0 }}>
          <SearchField
            size="small"
            label={search.label}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
          />
        </Box>
      ) : null}
      {filtering ? (
        <FilterPanelTrigger
          render={(props, state) => (
            <ToolbarButton
              {...props}
              render={<Button variant="outlined" startIcon={<FilterListRounded />} />}
            >
              Filtros
              {(filterCount ?? state.filterCount) > 0
                ? ` (${filterCount ?? state.filterCount})`
                : ""}
            </ToolbarButton>
          )}
        />
      ) : null}
    </Toolbar>
  );
}

function AdminFilterPanel() {
  const { filterPanel } = useContext(GridControlsContext);
  return filterPanel;
}

function AdminNoRowsOverlay() {
  const { emptyMessage, error } = useContext(GridControlsContext);
  return error ? null : <ContentState status="empty" message={emptyMessage} />;
}

export function AdminDataGrid<R extends GridValidRowModel>({
  ariaLabel,
  rows,
  columns,
  getRowId,
  loading = false,
  error,
  emptyMessage,
  pagination,
  search,
  filterCount,
  filterPanel,
  filtering = Boolean(filterPanel),
}: AdminDataGridProps<R>) {
  const pageSize = pagination.pageSize ?? ADMIN_TABLE_PAGE_SIZE;
  // Una consulta de otra página no debe reiniciar el grid mientras llega su total.
  const [knownTotal, setKnownTotal] = useState(pagination.total);
  if (!loading && !error && knownTotal !== pagination.total)
    setKnownTotal(pagination.total);
  const rowCount = loading || error ? knownTotal : pagination.total;
  const controls = useMemo(
    () => ({ search, filtering, filterCount, filterPanel, emptyMessage, error }),
    [search, filtering, filterCount, filterPanel, emptyMessage, error],
  );

  return (
    <GridControlsContext.Provider value={controls}>
      <Stack spacing={1} sx={{ minWidth: 0 }}>
        {error ? <ContentState status="error" message={error} /> : null}
        <FlatSurface
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: 320,
            maxHeight: 680,
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <DataGrid<R>
            aria-label={ariaLabel}
            rows={rows}
            columns={columns}
            getRowId={getRowId}
            loading={loading}
            rowHeight={72}
            columnHeaderHeight={44}
            disableRowSelectionOnClick
            disableColumnSorting
            disableColumnSelector
            disableColumnMenu
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={{ page: pagination.page, pageSize }}
            onPaginationModelChange={(model) => {
              if (model.page !== pagination.page) pagination.onPageChange(model.page);
            }}
            pageSizeOptions={[pageSize]}
            filterMode="server"
            showToolbar={Boolean(search || filtering)}
            slots={{
              toolbar: AdminGridToolbar,
              panel: AdminGridPanel,
              filterPanel: AdminFilterPanel,
              noRowsOverlay: AdminNoRowsOverlay,
            }}
            slotProps={{
              loadingOverlay: { variant: "linear-progress", noRowsVariant: "skeleton" },
            }}
            localeText={{
              ...esES.components.MuiDataGrid.defaultProps.localeText,
              noRowsLabel: emptyMessage,
            }}
            sx={{
              border: 0,
              minWidth: 0,
              bgcolor: "background.paper",
              "--DataGrid-containerBackground": "var(--mui-palette-background-subtle)",
              "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
              "& .MuiDataGrid-footerContainer": { minHeight: 56 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-input": {
                display: "none",
              },
              "& .MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 } },
            }}
          />
        </FlatSurface>
      </Stack>
    </GridControlsContext.Provider>
  );
}
