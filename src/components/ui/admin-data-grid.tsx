"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  DataGrid,
  FilterPanelTrigger,
  GridOverlay,
  GridPanel,
  Toolbar,
  ToolbarButton,
  type DataGridProps,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";

import {
  ADMIN_TABLE_PAGE_SIZE,
  AdminTableFooter,
  type AdminTablePagination,
} from "./admin-table";
import { ContentState } from "./content-state";
import { FlatSurface } from "./flat-surface";
import { LoadingState } from "./loading-state";
import { SearchField } from "./search-field";

type GridSearch = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export type AdminMobileCard = {
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  fields?: Array<{ label: string; value: ReactNode }>;
  primaryAction?: { label: string; onClick: () => void };
  actions?: ReactNode;
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
  /** Controles específicos de la tabla dentro de la barra compartida. */
  toolbarContent?: ReactNode;
  toolbarActions?: ReactNode;
  hideFooter?: boolean;
  /** Datos y acciones resumidas para tarjetas en pantallas menores a 600 px. */
  mobileCard: (row: R) => AdminMobileCard;
};

type GridControls = Pick<
  AdminDataGridProps<GridValidRowModel>,
  | "search"
  | "filterCount"
  | "filterPanel"
  | "emptyMessage"
  | "filtering"
  | "error"
  | "toolbarContent"
  | "toolbarActions"
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
  const { search, filtering, filterCount, toolbarContent, toolbarActions } =
    useContext(GridControlsContext);
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
      {toolbarContent ? (
        <Box sx={{ flex: "1 1 220px", minWidth: 0 }}>{toolbarContent}</Box>
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
      {toolbarActions ? (
        <Stack direction="row" gap={1} sx={{ ml: "auto", flexShrink: 0 }}>
          {toolbarActions}
        </Stack>
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

function AdminLoadingOverlay() {
  return (
    <GridOverlay>
      <LoadingState label="Cargando datos" />
    </GridOverlay>
  );
}

export function AdminDataGrid<R extends GridValidRowModel>({
  ariaLabel,
  rows = [],
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
  toolbarContent,
  toolbarActions,
  hideFooter = false,
  mobileCard,
}: AdminDataGridProps<R>) {
  const pageSize = pagination.pageSize ?? ADMIN_TABLE_PAGE_SIZE;
  // Una consulta de otra página no debe reiniciar el grid mientras llega su total.
  const [knownTotal, setKnownTotal] = useState(pagination.total);
  if (!loading && !error && knownTotal !== pagination.total)
    setKnownTotal(pagination.total);
  const rowCount = loading || error ? knownTotal : pagination.total;
  const controls = useMemo(
    () => ({
      search,
      filtering,
      filterCount,
      filterPanel,
      emptyMessage,
      error,
      toolbarContent,
      toolbarActions,
    }),
    [
      search,
      filtering,
      filterCount,
      filterPanel,
      emptyMessage,
      error,
      toolbarContent,
      toolbarActions,
    ],
  );

  const gridProps = {
    "aria-label": ariaLabel,
    rows,
    columns,
    getRowId,
    loading,
    disableRowSelectionOnClick: true,
    disableColumnSorting: true,
    disableColumnSelector: true,
    disableColumnMenu: true,
    paginationMode: "server" as const,
    rowCount,
    paginationModel: { page: pagination.page, pageSize },
    onPaginationModelChange: (model: { page: number }) => {
      if (model.page !== pagination.page) pagination.onPageChange(model.page);
    },
    pageSizeOptions: [pageSize],
    filterMode: "server" as const,
    showToolbar: Boolean(search || filtering || toolbarContent || toolbarActions),
    slots: {
      toolbar: AdminGridToolbar,
      panel: AdminGridPanel,
      filterPanel: AdminFilterPanel,
      noRowsOverlay: AdminNoRowsOverlay,
      loadingOverlay: AdminLoadingOverlay,
    },
    slotProps: {
      loadingOverlay: {
        variant: "circular-progress" as const,
        noRowsVariant: "circular-progress" as const,
      },
    },
    localeText: {
      ...esES.components.MuiDataGrid.defaultProps.localeText,
      noRowsLabel: emptyMessage,
    },
  };

  return (
    <GridControlsContext.Provider value={controls}>
      <Stack spacing={1} sx={{ minWidth: 0 }}>
        {error ? <ContentState status="error" message={error} /> : null}
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
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
              {...gridProps}
              rowHeight={72}
              columnHeaderHeight={44}
              hideFooter={hideFooter}
              sx={desktopGridSx}
            />
          </FlatSurface>
        </Box>

        <Box sx={{ display: { xs: "block", sm: "none" }, minWidth: 0 }}>
          <Stack spacing={1.5} sx={{ minWidth: 0 }}>
            <FlatSurface
              sx={{
                width: "100%",
                minWidth: 0,
                overflow: "visible",
                "& .MuiDataGrid-root": { height: "auto", minHeight: 0 },
              }}
            >
              <DataGrid<R>
                {...gridProps}
                rowHeight={72}
                columnHeaderHeight={44}
                hideFooter
                sx={{
                  ...desktopGridSx,
                  height: "auto",
                  minHeight: 0,
                  "& .MuiDataGrid-main, & .MuiDataGrid-footerContainer": {
                    display: "none",
                  },
                }}
              />
            </FlatSurface>

            {loading ? (
              <FlatSurface padding="default">
                <ContentState status="loading" label="Cargando datos" />
              </FlatSurface>
            ) : error ? null : rows.length === 0 ? (
              <FlatSurface>
                <ContentState status="empty" message={emptyMessage} />
              </FlatSurface>
            ) : (
              <Stack component="ul" spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0 }}>
                {rows.map((row, index) => {
                  const card = mobileCard(row);
                  const id = getRowId
                    ? getRowId(row)
                    : ((row.id as string | number | undefined) ?? index);
                  return (
                    <Box component="li" key={id}>
                      <Card
                        component="article"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Stack spacing={1.5}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="flex-start"
                              justifyContent="space-between"
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={600}
                                  sx={{ overflowWrap: "anywhere" }}
                                >
                                  {card.title}
                                </Typography>
                                {card.subtitle ? (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                  >
                                    {card.subtitle}
                                  </Typography>
                                ) : null}
                              </Box>
                              {card.status ? (
                                <Box sx={{ flexShrink: 0 }}>{card.status}</Box>
                              ) : null}
                            </Stack>

                            {card.fields?.length ? (
                              <Box
                                component="dl"
                                sx={{
                                  m: 0,
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
                                  gap: 1.5,
                                }}
                              >
                                {card.fields.map(({ label, value }, fieldIndex) => (
                                  <Box
                                    key={`${label}-${fieldIndex}`}
                                    sx={{ minWidth: 0 }}
                                  >
                                    <Typography
                                      component="dt"
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {label}
                                    </Typography>
                                    <Box
                                      component="dd"
                                      sx={{
                                        m: 0,
                                        typography: "body2",
                                        overflowWrap: "anywhere",
                                      }}
                                    >
                                      {value}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            ) : null}

                            {card.primaryAction || card.actions ? (
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                spacing={1}
                                sx={{ pt: 0.5 }}
                              >
                                {card.primaryAction ? (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={card.primaryAction.onClick}
                                  >
                                    {card.primaryAction.label}
                                  </Button>
                                ) : (
                                  <Box />
                                )}
                                {card.actions}
                              </Stack>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Stack>
            )}

            {!hideFooter ? (
              <AdminTableFooter
                page={pagination.page}
                pageSize={pageSize}
                total={pagination.total}
                onPageChange={pagination.onPageChange}
              />
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </GridControlsContext.Provider>
  );
}

const desktopGridSx = {
  border: 0,
  minWidth: 0,
  bgcolor: "background.paper",
  "--DataGrid-containerBackground": "var(--mui-palette-background-subtle)",
  "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
  "& .MuiDataGrid-cell .MuiIconButton-root": {
    width: 42,
    height: 42,
    "& .MuiSvgIcon-root": { fontSize: 24 },
  },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
  "& .MuiDataGrid-footerContainer": { minHeight: 56 },
  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-input": {
    display: "none",
  },
  "& .MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 } },
  "& .MuiTablePagination-actions .MuiIconButton-root": {
    width: 32,
    height: 32,
    p: 0,
    border: 0,
    backgroundColor: "transparent",
    "&:hover, &.Mui-disabled": { backgroundColor: "transparent" },
    "& .MuiSvgIcon-root": { fontSize: 20 },
  },
};
