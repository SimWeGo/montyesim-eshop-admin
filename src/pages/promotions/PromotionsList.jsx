import SearchIcon from "@mui/icons-material/Search";
import {
  Card,
  FormControl,
  Grid2,
  Switch,
  TableCell,
  TablePagination,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import { getAllBundlesDropdown } from "../../core/apis/bundlesAPI";
import { getAllRulesDropdown } from "../../core/apis/rulesAPI";
import {
  deletePromotion,
  getAllPromotions,
  togglePromotionStatus,
} from "../../core/apis/promotionsAPI";
import dayjs from "dayjs";
import MuiModal from "../../Components/Modals/MuiModal";
import { DefaultCurrency } from "../../core/vairables/EnumData";
import PromotionDetail from "../../Components/page-component/promotion/PromotionDetail";

const PromotionsList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState({ open: false, data: null });
  const [openDetail, setOpenDetail] = useState({ open: false, data: null });
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRule, setSelectedRule] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    pageSize: 10,
    page: 0,
    rules: [],
    bundles: [],
  });

  const getPromotions = async () => {
    setLoading(true);

    try {
      const { name, page, pageSize, rules, bundles } = searchQueries;

      getAllPromotions(
        page,
        pageSize,
        name,
        rules?.map((el) => {
          return el?.id;
        }),
        bundles?.map((el) => el?.value).join(",")
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
    getPromotions();
  }, [searchQueries]);

  const resetFilters = () => {
    setSearchQueries({ ...searchQueries, name: "", rules: [], bundles: [] });
    setSearch("");
    setSelectedRule([]);
    setSelectedBundle([]);
  };

  const applyFilter = () => {
    setSearchQueries({
      ...searchQueries,
      name: search,
      rules: selectedRule || [],
      bundles: selectedBundle || [],
    });
  };

  const tableHeaders = [
    { name: "Name" },
    { name: "Code" },
    { name: "Rule" },
    { name: "Value" },
    { name: "from" },
    { name: "To" },

    { name: "Bundles" },
    { name: "Status" },
  ];

  const handlePromotionStatus = (promotion) => {
    togglePromotionStatus({
      id: promotion?.id,
      currentValue: promotion?.is_active,
    }).then((res) => {
      if (!res?.error) {
        getPromotions();
        toast.success("Promotion status updated successfully");
      } else {
        toast.error(res?.error || "Failed to change promotion status");
      }
    });
  };

  const loadRuleOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;

    const res = await getAllRulesDropdown({
      page,
      pageSize,
      search,
    });
    if (!res?.error) {
      return {
        options: res?.data?.map((item) => ({
          ...item,
          value: item.id,
          label: `${item?.name}`,
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

  const loadBundleOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;

    const res = await getAllBundlesDropdown({
      page,
      pageSize,
      search,
    });
    if (!res?.error) {
      return {
        options: res?.data?.map((item) => ({
          ...item,
          value: item?.data?.bundle_code,
          label: item?.data?.bundle_code,
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

  const handleDeletePromotion = (promotion) => {
    deletePromotion(promotion?.code)
      .then((res) => {
        if (res?.status >= 200 && res?.status < 300) {
          toast.success("Promotion deleted successfully");
          getPromotions();
        } else {
          toast.error(res?.error);
        }
      })
      .catch((error) => {
        toast.error(error?.message || "Failed to save rule");
      })
      .finally(() => {
        setOpenDelete({ data: null, open: false });
      });
  };

  const displayUnit = (actionName) => {
    if (actionName?.toLowerCase().includes("amount")) return DefaultCurrency;
    return "%";
  };

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={
          (!search || search === "") &&
          selectedRule?.length === 0 &&
          selectedBundle?.length === 0
        }
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
                placeholder="Search by name or code"
                type="text"
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon />,
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
                Rules
              </label>
              <AsyncPaginate
                inputId="tags-select"
                isMulti={true}
                isClearable={true}
                value={selectedRule}
                loadOptions={loadRuleOptions}
                placeholder={"Select Rules"}
                onChange={(value) => {
                  if (!value) {
                    resetFilters();
                  } else {
                    setSelectedRule(value);
                  }
                }}
                additional={{ page: 1 }}
                isSearchable
                debounceTimeout={300}
                styles={{
                  ...asyncPaginateStyles,
                }}
                // formatOptionLabel={formatOptionLabel}
              />
            </FormControl>
          </Grid2>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="tags-select">
                Bundles
              </label>
              <AsyncPaginate
                inputId="tags-select"
                isMulti={true}
                isClearable={true}
                value={selectedBundle}
                loadOptions={loadBundleOptions}
                placeholder={"Select Bundles"}
                onChange={(value) => {
                  if (!value) {
                    resetFilters();
                  } else {
                    setSelectedBundle(value);
                  }
                }}
                additional={{ page: 1 }}
                isSearchable
                debounceTimeout={300}
                styles={{
                  ...asyncPaginateStyles,
                }}
                // formatOptionLabel={formatOptionLabel}
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
        actions={true}
        onAdd={() => navigate("/promotions/add")}
      >
        {data?.map((el) => (
          <RowComponent
            key={el?.id}
            actions={true}
            onEdit={() => navigate(`/promotions/${el?.id}`)}
            onDelete={() => setOpenDelete({ data: el, open: true })}
            onView={() => setOpenDetail({ data: el?.id, open: true })}
          >
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.name || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.code || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {`${el?.promotion_rule?.name}`}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.amount
                ? `${el?.amount} ${displayUnit(
                    el?.promotion_rule?.promotion_rule_action?.name
                  )}`
                : "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.valid_from
                ? dayjs(el?.valid_from).format("DD-MM-YYYY")
                : "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.valid_to ? dayjs(el?.valid_to).format("DD-MM-YYYY") : "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.bundle_code || "All"}
            </TableCell>
            <TableCell sx={{ minWidth: "100px" }}>
              <Switch
                color="success"
                checked={el?.is_active}
                onChange={() => handlePromotionStatus(el)}
                name="is_active"
              />
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

      {openDelete?.open && (
        <MuiModal
          open={true}
          onClose={() => setOpenDelete({ data: null, open: false })}
          title={"Notice!"}
          onConfirm={() => handleDeletePromotion(openDelete?.data)}
        >
          <p className={"text-center"}>
            Are you sure you want to delete{" "}
            <span className={"font-bold"}>
              {openDelete?.data?.name ? `${openDelete?.data?.name}'s` : "this"}{" "}
            </span>{" "}
            promotion?
          </p>
        </MuiModal>
      )}

      {openDetail?.open && (
        <PromotionDetail
          onClose={() => setOpenDetail({ data: null, open: false })}
          id={openDetail?.data}
        />
      )}
    </Card>
  );
};

export default PromotionsList;
