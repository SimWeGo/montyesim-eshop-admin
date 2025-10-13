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
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import {
  DeleteVoucher,
  getAllVouchers,
  toggleVoucherStatus,
} from "../../core/apis/vouchersAPI";
import VoucherDeleteModal from "./components/modals/VoucherDeleteModal";
import VoucherFormModal from "./components/modals/VoucherFormModal";
import { DefaultCurrency } from "../../core/vairables/EnumData";
import CountUp from "react-countup";

export default function VoucherPage() {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState({ open: false, data: null });
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [searchQueries, setSearchQueries] = useState({
    search: "",
    pageSize: 10,
    page: 0,
  });
  const [modalCtx, setModalCtx] = useState({
    open: false,
    data: null,
  });

  const getVouchers = async () => {
    setLoading(true);
    try {
      const { page, pageSize, search } = searchQueries;
      const res = await getAllVouchers({ page, pageSize, search });

      if (res?.error) {
        toast.error(res?.error);
        setData([]);
        setTotalRows(0);
      } else {
        setTotalRows(res.count);
        setData(
          res.data.map((el) => ({
            ...el,
            ...el?.metadata,
          }))
        );
      }
    } catch (e) {
      toast.error(e?.message || "Fail to display data");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getVouchers();
  }, [searchQueries]);

  const resetFilters = () => {
    setSearchQueries({ ...searchQueries, search: "" });
    setSearch("");
  };

  const applyFilter = () => {
    setSearchQueries({ ...searchQueries, search: search });
  };

  const tableHeaders = [
    { name: "Code" },
    { name: "Amount" },
    { name: "Used By" },
    { name: "Expired At" },
    { name: "Created At" },
    { name: "Is Active" },
  ];

  const handleVoucherStatus = (voucher) => {
    toggleVoucherStatus({
      id: voucher?.id,
      currentValue: voucher?.is_active,
    }).then((res) => {
      if (!res?.error) {
        getVouchers();
        toast.success("Voucher status updated successfully");
      } else {
        toast.error(res?.error || "Failed to change voucher status");
      }
    });
  };

  const handleDeleteVoucher = () => {
    const voucher = openDelete?.data;

    DeleteVoucher(voucher?.id).then((res) => {
      if (!res?.error) {
        getVouchers();
        toast.success("Voucher deleted successfully");
      } else {
        toast.error(res?.error || "Failed to delete voucher");
      }

      setOpenDelete({ data: null, open: false });
    });
  };

  const handleOpenDeleteModal = (el) => {
    if (el?.is_used) {
      toast.error("Cannot delete voucher — it has already been used.");
      return;
    }
    setOpenDelete({ data: el, open: true });
  };

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={!search || search === ""}
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
        </Grid2>
      </Filters>

      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        tableHeaders={tableHeaders}
        actions={true}
        onAdd={() => setModalCtx({ open: true, data: null })}
      >
        {data?.map((el) => (
          <RowComponent
            key={el?.id}
            actions={true}
            onDelete={() => handleOpenDeleteModal(el)}
          >
            <TableCell
              sx={{ minWidth: "150px" }}
              className={"max-w-[200px] truncate"}
            >
              {el?.code || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "150px" }}
              className={"max-w-[200px] truncate"}
            >
              {DefaultCurrency}{" "}
              <CountUp
                start={0}
                end={el?.amount}
                duration={1.5}
                separator=","
                decimals={2}
              />
            </TableCell>
            <TableCell
              sx={{ minWidth: "150px" }}
              className={"max-w-[200px] truncate"}
            >
              {el?.user?.email || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.expired_at
                ? dayjs(el?.expired_at).format("DD-MM-YYYY")
                : "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.created_at
                ? dayjs(el?.created_at).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>

            <TableCell sx={{ minWidth: "100px" }}>
              <Switch
                color="success"
                checked={el?.is_active}
                onChange={() => handleVoucherStatus(el)}
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
        <VoucherDeleteModal
          setOpenDelete={setOpenDelete}
          openDelete={openDelete}
          handleDeleteVoucher={handleDeleteVoucher}
        />
      )}
      {modalCtx?.open && (
        <VoucherFormModal
          voucher={modalCtx?.data}
          open={modalCtx?.open}
          onClose={() => setModalCtx({ open: false, data: null })}
          onSuccess={() => {
            setModalCtx({
              open: false,
              data: null,
            });
            getVouchers();
          }}
        />
      )}
    </Card>
  );
}
