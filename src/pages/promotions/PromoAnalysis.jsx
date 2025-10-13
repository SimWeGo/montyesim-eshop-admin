import SearchIcon from "@mui/icons-material/Search";
import {
  Card,
  FormControl,
  Grid2,
  TableCell,
  TablePagination,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { useEffect, useState } from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import { getAllBundlesDropdown } from "../../core/apis/bundlesAPI";
import { getAllPromotionsUsage } from "../../core/apis/promotionsAPI";
import dayjs from "dayjs";
import TagComponent from "../../Components/shared/tag-component/TagComponent";
import { getAllUsersDropdown } from "../../core/apis/usersAPI";
import PromotionDetail from "../../Components/page-component/promotion/PromotionDetail";
import { DefaultCurrency } from "../../core/vairables/EnumData";

const PromoAnalysis = () => {
  const theme = useTheme();
  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [openPromoDetail, setOpenPromoDetail] = useState({
    open: false,
    data: null,
  });
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    pageSize: 10,
    page: 0,
    users: [],
    bundles: [],
  });

  const getPromotions = async () => {
    setLoading(true);

    try {
      const { name, page, pageSize, users, bundles } = searchQueries;

      getAllPromotionsUsage(
        page,
        pageSize,
        name,
        users?.value,
        bundles?.map((el) => el?.value)
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
    setSearchQueries({ ...searchQueries, name: "", users: [], bundles: [] });
    setSearch("");
    setSelectedUser([]);
  };

  const applyFilter = () => {
    setSearchQueries({
      ...searchQueries,
      name: search,
      users: selectedUser || [],
      bundles: selectedBundle || [],
    });
  };

  const tableHeaders = [
    { name: "User Email" },
    { name: "User Phone" },
    { name: "Promo Code" },
    { name: "Amount" },
    { name: "Bundle Code" },
    { name: "Status" },
    { name: "Created At" },
  ];

  const loadUsersOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;

    const res = await getAllUsersDropdown({
      page,
      pageSize,
      name: search,
    });
    if (!res?.error) {
      return {
        options: res?.data?.map((item) => ({
          ...item,
          value: item.id,
          label: item.email || item?.metadata?.email,
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

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={
          (!search || search === "") &&
          selectedUser?.length === 0 &&
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
                placeholder="Search by promo code"
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
                Users
              </label>
              <AsyncPaginate
                inputId="tags-select"
                isClearable={true}
                value={selectedUser}
                loadOptions={loadUsersOptions}
                placeholder={"Select User"}
                onChange={(value) => {
                  if (!value) {
                    resetFilters();
                  } else {
                    setSelectedUser(value);
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
                Bundles Code
              </label>
              <AsyncPaginate
                inputId="tags-select"
                isMulti={true}
                isClearable={true}
                value={selectedBundle}
                loadOptions={loadBundleOptions}
                placeholder={"Select Bundles Code"}
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
        actions={false}
      >
        {data?.map((el) => (
          <RowComponent key={el?.id} actions={false}>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.user?.metadata?.email || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.user?.metadata?.msisdn || "N/A"}
            </TableCell>
            <TableCell
              onClick={() =>
                setOpenPromoDetail({ open: true, data: el?.promotion?.id })
              }
              sx={{ minWidth: "200px" }}
              className={
                "max-w-[250px] truncate cursor-pointer underline !text-(--color-secondary)"
              }
            >
              {el?.promotion_code || "N/A"}
            </TableCell>

            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.amount ? `${el?.amount} ${DefaultCurrency}` : "N/A"}
            </TableCell>

            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.bundle_id || "All"}
            </TableCell>
            <TableCell sx={{ minWidth: "100px" }}>
              <TagComponent value={el?.status} />
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.created_at
                ? dayjs(el?.created_at).format("DD-MM-YYYY")
                : "N/A"}
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

      {openPromoDetail?.open && (
        <PromotionDetail
          onClose={() => setOpenPromoDetail({ data: null, open: false })}
          id={openPromoDetail?.data}
        />
      )}
    </Card>
  );
};

export default PromoAnalysis;
