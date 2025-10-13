import { Edit, Visibility } from "@mui/icons-material";
import LayersIcon from "@mui/icons-material/Layers";
import SearchIcon from "@mui/icons-material/Search";
import {
  Card,
  FormControl,
  Grid2,
  IconButton,
  Switch,
  TableCell,
  TablePagination,
  TextField,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import BundleDetail from "../../Components/page-component/bundles/BundleDetail";
import UpdateBundleName from "../../Components/page-component/bundles/UpdateBundleName";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import { getAllBundles, toggleBundleStatus } from "../../core/apis/bundlesAPI";
import { getAllBundleTags } from "../../core/apis/tagsAPI";

const BundleList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};
  const [loading, setLoading] = useState(false);
  const [openDetail, setOpenDetail] = useState({ open: false, data: null });
  const [openUpdate, setOpenUpdate] = useState({ open: false, data: null });
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    pageSize: 10,
    page: 0,
    tags: [],
  });

  const getBundles = async () => {
    setLoading(true);

    try {
      const { name, page, pageSize, tags } = searchQueries;

      getAllBundles(
        page,
        pageSize,
        name,
        tags?.map((el) => {
          return el?.id;
        })
      )
        .then((res) => {
          if (res?.error) {
            toast.error(res?.error);
            setLoading(false);
            setData([]);
            setTotalRows(0);
          } else {
            setTotalRows(res?.count);
            setData(
              res?.data?.map((el) => ({
                ...el,
                ...el?.metadata,
              }))
            );
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (e) {
      toast.error(e?.message || "Fail to display data");
      setLoading(false);
    }
  };

  useEffect(() => {
    getBundles();
  }, [searchQueries]);

  const resetFilters = () => {
    setSearchQueries({ ...searchQueries, name: "" });
    setSearch("");
    setSelectedTags([]);
  };

  const applyFilter = () => {
    setSearchQueries({
      ...searchQueries,
      name: search,
      tags: selectedTags || [],
    });
  };

  const tableHeaders = [
    { name: "ID" },
    { name: "Code" },
    { name: "Name" },
    { name: "Display Name" },
    // { name: "Is Active" },

    { name: "" },
  ];

  const handleBundleStatus = (bundle) => {
    toggleBundleStatus({
      id: bundle?.id,
      currentValue: bundle?.is_active,
    }).then((res) => {
      if (!res?.error) {
        getBundles();
      }
    });
  };

  const loadTagsOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;

    const res = await getAllBundleTags({ page, pageSize, search });
    if (!res?.error) {
      return {
        options: res?.data?.map((item) => ({
          ...item,
          value: item.id,
          label: item.title,
        })),
        hasMore: res?.data?.length === pageSize,
        additional: {
          page: page + 1,
        },
      };
    } else {
      return {
        options: [...loadedOptions],
        hasMore: false,
        additional: {
          page: page,
        },
      };
    }
  };

  const handleNavigateAssignGroups = (el) => {
    if (!el.id) {
      return;
    }
    navigate(`/bundles/${el?.id}/assign`);
  };

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={(!search || search === "") && selectedTags?.length === 0}
      >
        <Grid2 container size={{ xs: 12 }} spacing={2}>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-input">
                Search
              </label>
              <TextField
                id="search-input"
                fullWidth
                required
                size="small"
                placeholder="Search"
                type="text"
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                    autoComplete: "new-password",
                    form: {
                      autoComplete: "off",
                    },
                  },
                }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />
            </FormControl>
          </Grid2>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="tags-select">
                Tags
              </label>
              <AsyncPaginate
                inputId="tags-select"
                isMulti={true}
                isClearable={true}
                value={selectedTags}
                loadOptions={loadTagsOptions}
                placeholder={"Select Tags"}
                onChange={(value) => {
                  if (!value) {
                    resetFilters();
                  } else {
                    setSelectedTags(value);
                  }
                }}
                additional={{ page: 1 }}
                isSearchable
                debounceTimeout={300}
                styles={{
                  ...asyncPaginateStyles,
                }}
              />
            </FormControl>
          </Grid2>
        </Grid2>
      </Filters>

      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        tableHeaders={tableHeaders}
        actions={false}
      >
        {data?.map((el) => (
          <RowComponent key={el?.id} actions={false}>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.id}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.data?.bundle_info_code}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.data?.bundle_name || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.bundle_name || "N/A"}
            </TableCell>
            {/* <TableCell sx={{ minWidth: "100px" }}>
              <Switch
                color="success"
                checked={el?.is_active}
                onChange={() => handleBundleStatus(el)}
                name="is_active"
              />
            </TableCell> */}

            <TableCell className={"whitespace-nowrap"}>
              <Tooltip title={"Assign Group"} placement={"top"}>
                <IconButton
                  color="primary"
                  aria-label="assign"
                  onClick={(event) => {
                    handleNavigateAssignGroups(el);
                  }}
                >
                  <LayersIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Edit Display Name"} placement={"top"}>
                <IconButton
                  color="primary"
                  aria-label="edit"
                  onClick={(event) => {
                    setOpenUpdate({ open: true, data: el });
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={"View Detail"} placement={"top"}>
                <IconButton
                  color="primary"
                  aria-label="view"
                  onClick={() => {
                    setOpenDetail({ open: true, data: el });
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>
      <TablePagination
        component="div"
        count={totalRows || 0}
        page={searchQueries?.page}
        onPageChange={(value, page) =>
          setSearchQueries({ ...searchQueries, page: page })
        }
        rowsPerPage={searchQueries?.pageSize}
        onRowsPerPageChange={(e) => {
          setSearchQueries({ ...searchQueries, pageSize: e.target.value });
        }}
      />

      {openUpdate?.open && (
        <UpdateBundleName
          onClose={() => setOpenUpdate({ open: false, data: null })}
          data={openUpdate?.data || null}
          refetchData={getBundles}
        />
      )}
      {openDetail?.open && (
        <BundleDetail
          onClose={() => setOpenDetail({ open: false, data: null })}
          bundle={openDetail?.data?.data}
        />
      )}
    </Card>
  );
};

export default BundleList;
