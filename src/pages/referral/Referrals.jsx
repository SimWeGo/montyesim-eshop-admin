import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import TagComponent from "../../Components/shared/tag-component/TagComponent";
import {
  Button,
  Card,
  CircularProgress,
  FormControl,
  Grid2,
  TableCell,
  TablePagination,
  TextField,
  useTheme,
} from "@mui/material";
import { toast } from "react-toastify";
import CountUp from "react-countup";
import {
  getAllReferralTransactions,
  getAllUsersDropdown,
} from "../../core/apis/usersAPI";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import Filters from "../../Components/Filters/Filters";
import SearchIcon from "@mui/icons-material/Search";
import { FileDownload } from "@mui/icons-material";
import { exportReferralExcel } from "../users/helpers/exportExcel";
import { AsyncPaginate } from "react-select-async-paginate";
import { FormDate } from "../../Components/form-component/FormComponent";
export default function Referrals() {
  const { id } = useParams();
  const theme = useTheme();

  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};

  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [selectedFromUser, setSelectedFromUser] = useState(null);
  const [referralDate, setReferralDate] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
    search: "",
    user: null,
    from_user: null,
    referral_date: null,
  });

  const tableHeaders = [
    { name: "Refer Code" },
    { name: "Reward Amount" },
    { name: "From User Email" },
    { name: "To User Email" },
    { name: "Order Number" },
    { name: "Order Status" },
    { name: "Usage Status" },
    { name: "Referral Date" },
    { name: "Purchased Date" },
  ];

  const handleExportClick = async () => {
    const { search, user, from_user, referral_date } = searchQueries;
    setExporting(true);
    await exportReferralExcel(user, search, from_user, referral_date).then(
      (res) => {
        toast?.[res?.count ? "success" : "error"](
          res?.count ? "Exported Successfully" : res?.message
        );
        setExporting(false);
      }
    );
  };

  const getReferralTransactions = async () => {
    setLoading(true);
    try {
      const { page, pageSize, search, user, from_user, referral_date } =
        searchQueries;

      const res = await getAllReferralTransactions(
        page,
        pageSize,
        user,
        search,
        from_user,
        referral_date
      );
      if (res?.error) {
        throw res.error;
      }

      const rows = res?.data || [];

      setData(rows);
      setTotalRows(res?.total ?? 0);
    } catch (e) {
      toast.error(e?.message || "Failed to load referral transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadFromOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;
    const res = await getAllUsersDropdown({ page, pageSize, name: search });
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

  const loadOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;
    const res = await getAllUsersDropdown({ page, pageSize, name: search });
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
  const resetFilters = () => {
    setSearchQueries({
      ...searchQueries,
      search: "",
      user: null,
      from_user: null,
      referral_date: null,
    });
    setSearch("");
    setSelectedFromUser(null);
    setReferralDate(null);
    setSelectedUser(null);
  };

  const applyFilter = () => {
    setSearchQueries({
      ...searchQueries,
      search: search,
      user: selectedUser?.id,
      from_user: selectedFromUser?.email,
      referral_date: referralDate,
    });
  };

  useEffect(() => {
    getReferralTransactions();
  }, [searchQueries, id]);

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={
          (!search || search === "") &&
          selectedUser?.length === 0 &&
          selectedFromUser?.length === 0 &&
          referralDate === null
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
                placeholder="Search by code"
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
              <label className="mb-2" htmlFor="user-input">
                From User
              </label>

              <AsyncPaginate
                id="user-input"
                isClearable={true}
                value={selectedFromUser}
                placeholder={"Select User Email"}
                loadOptions={loadFromOptions}
                onChange={(value) => setSelectedFromUser(value)}
                additional={{ page: 1 }}
                isSearchable
                debounceTimeout={300}
                styles={{
                  ...asyncPaginateStyles,
                }}
              />
            </FormControl>
          </Grid2>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="user-input">
                To User
              </label>

              <AsyncPaginate
                id="user-input"
                isClearable={true}
                value={selectedUser}
                placeholder={"Select User Email"}
                loadOptions={loadOptions}
                onChange={(value) => setSelectedUser(value)}
                additional={{ page: 1 }}
                isSearchable
                debounceTimeout={300}
                styles={{
                  ...asyncPaginateStyles,
                }}
              />
            </FormControl>
          </Grid2>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-input">
                Referral Date
              </label>
              <FormDate
                value={referralDate}
                onChange={(value) => setReferralDate(value)}
                placeholder="Select expiry date"
              />
            </FormControl>
          </Grid2>
        </Grid2>
      </Filters>
      <Grid2 className="flex justify-end" size={{ xs: 12 }}>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={handleExportClick}
          startIcon={
            exporting ? (
              <CircularProgress color="inherit" size={18} />
            ) : (
              <FileDownload />
            )
          }
          disabled={exporting}
        >
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </Grid2>
      <TableComponent
        loading={loading}
        dataPerPage={searchQueries.pageSize}
        tableData={data}
        noDataFound={"No Referral Transactions Found"}
        tableHeaders={tableHeaders}
        actions={false}
      >
        {data?.map((el, idx) => (
          <RowComponent key={el?.id || idx} actions={false}>
            <TableCell
              sx={{ minWidth: 140 }}
              className="max-w-[220px] truncate"
            >
              {el?.referral_code || "N/A"}
            </TableCell>
            <TableCell sx={{ minWidth: 140 }}>
              {el?.currency}{" "}
              <CountUp
                start={0}
                end={el?.amount}
                duration={1.5}
                separator=","
                decimals={2}
              />
            </TableCell>

            <TableCell
              sx={{ minWidth: 220 }}
              className="max-w-[260px] truncate"
            >
              {el?.referred_to || "N/A"}
            </TableCell>

            <TableCell
              sx={{ minWidth: 220 }}
              className="max-w-[260px] truncate"
            >
              {el?.user_email || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: 160 }}
              className="max-w-[220px] truncate"
            >
              {el?.id || el?.transaction_id || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: 160 }}
              className="max-w-[220px] truncate"
            >
              <TagComponent value={el?.order_status} />
            </TableCell>
            <TableCell
              sx={{ minWidth: 160 }}
              className="max-w-[220px] truncate"
            >
              <TagComponent value={el?.status} />
            </TableCell>
            <TableCell sx={{ minWidth: 180 }}>
              {el?.created_at
                ? dayjs(el?.created_at).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>
            <TableCell sx={{ minWidth: 180 }}>
              {el?.payment_time
                ? dayjs(el.payment_time).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>

      <TablePagination
        component="div"
        count={totalRows || 0}
        page={searchQueries.page}
        onPageChange={(_, newPage) => {
          setSearchQueries({ ...searchQueries, page: newPage });
        }}
        rowsPerPage={searchQueries.pageSize}
        onRowsPerPageChange={(e) => {
          setSearchQueries({
            ...searchQueries,
            pageSize: Number(e.target.value),
            page: 0,
          });
        }}
      />
    </Card>
  );
}
