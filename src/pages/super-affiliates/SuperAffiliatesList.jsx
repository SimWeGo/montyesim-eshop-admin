import SearchIcon from "@mui/icons-material/Search";
import {
  Card,
  Chip,
  FormControl,
  Grid2,
  Switch,
  TableCell,
  TablePagination,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import * as yup from "yup";
import Filters from "../../Components/Filters/Filters";
import { FormInput } from "../../Components/form-component/FormComponent";
import ApiKeyRevealModal from "../../Components/Modals/ApiKeyRevealModal";
import MuiModal from "../../Components/Modals/MuiModal";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import {
  createSuperAffiliate,
  getAllSuperAffiliates,
  updateAffiliateRest,
} from "../../core/apis/superAffiliatesAPI";
import { useIsSuperAdmin } from "../../core/hoc/WithSuperAdminOnly";
import { formatRate } from "../../core/helpers/formatCurrency";
import SuperAffiliateDetail from "./SuperAffiliateDetail";

const emptyToNull = (value, original) =>
  original === "" || original === null ? null : value;

// Contraintes CreateSuperAffiliateRequest (§A3) : N ∈ (0, 100]
const createSchema = yup.object().shape({
  name: yup.string().label("Name").min(2).max(60).required().nullable(),
  email: yup.string().label("Email").email().nullable(),
  company_name: yup.string().label("Company").max(100).nullable(),
  contact_phone: yup.string().label("Phone").max(30).nullable(),
  network_commission_rate: yup
    .number()
    .label("Network rate")
    .transform(emptyToNull)
    .moreThan(0, "Network rate must be greater than 0")
    .max(100)
    .required()
    .nullable(),
  notes: yup.string().label("Notes").max(500).nullable(),
});

const SuperAffiliatesList = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState([]);
  const [search, setSearch] = useState("");
  // GET /admin/super-affiliates : liste complète (§A6) → pagination client
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    page: 0,
    pageSize: 10,
  });
  const [openCreate, setOpenCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedKey, setRevealedKey] = useState({
    open: false,
    apiKey: null,
    message: null,
  });
  const [openDetail, setOpenDetail] = useState({ open: false, data: null });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      email: "",
      company_name: "",
      contact_phone: "",
      network_commission_rate: null,
      notes: "",
    },
    resolver: yupResolver(createSchema),
    mode: "all",
  });

  const getSupers = () => {
    setLoading(true);
    getAllSuperAffiliates()
      .then((res) => {
        if (res?.error) {
          toast.error(res?.error);
          setAllData([]);
        } else {
          setAllData(res?.data || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getSupers();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQueries?.name?.trim()?.toLowerCase();
    if (!q) return allData;
    return allData?.filter((el) =>
      [el?.name, el?.email, el?.company_name]?.some((v) =>
        v?.toLowerCase()?.includes(q)
      )
    );
  }, [allData, searchQueries?.name]);

  const paginated = useMemo(() => {
    const from = searchQueries?.page * searchQueries?.pageSize;
    return filtered?.slice(from, from + searchQueries?.pageSize);
  }, [filtered, searchQueries]);

  const tableHeaders = [
    { name: "Name" },
    { name: "Email" },
    { name: "Company" },
    { name: "Network rate (N)" },
    { name: "Subs" },
    { name: "API Key" },
    { name: "Created" },
    { name: "Status" },
  ];

  // Un super EST une ligne affiliate → PATCH /admin/affiliates/{id}.
  // Un super inactif bloque attach + payout (SUPER_AFFILIATE_INACTIVE, §A5).
  const handleToggleStatus = (el) => {
    updateAffiliateRest(el?.id, { is_active: !el?.is_active }).then((res) => {
      if (!res?.error) {
        toast.success("Super-affiliate status updated successfully");
        getSupers();
      } else {
        toast.error(res?.error);
      }
    });
  };

  const handleCreate = (payload) => {
    setIsSubmitting(true);
    createSuperAffiliate({
      name: payload?.name?.trim(),
      email: payload?.email || null,
      company_name: payload?.company_name || null,
      contact_phone: payload?.contact_phone || null,
      network_commission_rate: Number(payload?.network_commission_rate),
      notes: payload?.notes || null,
    })
      .then((res) => {
        if (res?.error) {
          toast.error(
            res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
          );
        } else {
          setOpenCreate(false);
          reset();
          // Clé v2 one-shot (§A4) — jamais re-affichable
          setRevealedKey({
            open: true,
            apiKey: res?.data?.api_key,
            message: res?.data?.message,
          });
          getSupers();
        }
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <Card className="page-card">
      <Filters
        onReset={() => {
          setSearch("");
          setSearchQueries({ ...searchQueries, name: "", page: 0 });
        }}
        onApply={() =>
          setSearchQueries({ ...searchQueries, name: search, page: 0 })
        }
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
                size="small"
                placeholder="Search by name, email or company"
                type="text"
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon />,
                    autoComplete: "new-password",
                    form: { autoComplete: "off" },
                  },
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </FormControl>
          </Grid2>
        </Grid2>
      </Filters>

      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={paginated}
        tableHeaders={tableHeaders}
        actions={true}
        // POST /admin/super-affiliates = ARGENT (fixe N) → super_admin only
        onAdd={isSuperAdmin ? () => setOpenCreate(true) : undefined}
      >
        {paginated?.map((el) => (
          <RowComponent
            key={el?.id}
            actions={true}
            onView={() => setOpenDetail({ open: true, data: el?.id })}
          >
            <TableCell
              sx={{ minWidth: "150px" }}
              className={"max-w-[200px] truncate"}
            >
              {el?.name || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "150px" }}
              className={"max-w-[200px] truncate"}
            >
              {el?.email || "N/A"}
            </TableCell>
            <TableCell className={"max-w-[200px] truncate"}>
              {el?.company_name || "N/A"}
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                color="primary"
                label={formatRate(el?.network_commission_rate)}
              />
            </TableCell>
            <TableCell>{el?.subs_count ?? 0}</TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {el?.api_key_last_4 ? `••••${el?.api_key_last_4}` : "N/A"}
            </TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {el?.created_at
                ? dayjs(el?.created_at).format("DD-MM-YYYY")
                : "N/A"}
            </TableCell>
            <TableCell sx={{ minWidth: "100px" }}>
              <Switch
                color="success"
                checked={el?.is_active}
                onChange={() => handleToggleStatus(el)}
                name="is_active"
                disabled={!isSuperAdmin}
              />
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>
      <TablePagination
        component="div"
        count={filtered?.length || 0}
        page={searchQueries?.page}
        onPageChange={(value, page) =>
          setSearchQueries({ ...searchQueries, page: page })
        }
        rowsPerPage={searchQueries?.pageSize}
        onRowsPerPageChange={(e) => {
          setSearchQueries({
            ...searchQueries,
            pageSize: e.target.value,
            page: 0,
          });
        }}
      />

      {/* Dialog de création (form RHF + yup, gabarit maison) */}
      {openCreate && (
        <MuiModal
          open={true}
          onClose={() => {
            setOpenCreate(false);
            reset();
          }}
          title={"Create super-affiliate"}
          confirmButtonName={isSubmitting ? "Submitting..." : "Create"}
          onConfirm={handleSubmit(handleCreate)}
        >
          <div className={"flex flex-col gap-[1rem]"}>
            <div>
              <label>Name* </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormInput
                    placeholder={"Enter Name"}
                    value={value}
                    onChange={onChange}
                    helperText={error?.message}
                  />
                )}
                name="name"
                control={control}
              />
            </div>
            <div>
              <label>Email </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormInput
                    placeholder={"Enter Email"}
                    value={value}
                    onChange={onChange}
                    helperText={error?.message}
                  />
                )}
                name="email"
                control={control}
              />
            </div>
            <div className={"flex flex-wrap gap-[1rem]"}>
              <div className={"flex-1 min-w-[150px]"}>
                <label>Company </label>
                <Controller
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormInput
                      placeholder={"Enter Company"}
                      value={value}
                      onChange={onChange}
                      helperText={error?.message}
                    />
                  )}
                  name="company_name"
                  control={control}
                />
              </div>
              <div className={"flex-1 min-w-[150px]"}>
                <label>Phone </label>
                <Controller
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormInput
                      placeholder={"Enter Phone"}
                      value={value}
                      onChange={onChange}
                      helperText={error?.message}
                    />
                  )}
                  name="contact_phone"
                  control={control}
                />
              </div>
            </div>
            <div>
              <label>Network commission rate (N)* </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormInput
                    type={"number"}
                    placeholder={"Enter network rate"}
                    value={value}
                    onChange={onChange}
                    helperText={
                      error?.message ||
                      "Total network rate: promo P + sub commission S + super margin M"
                    }
                    endAdornment={"%"}
                  />
                )}
                name="network_commission_rate"
                control={control}
              />
            </div>
            <div>
              <label>Notes </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormInput
                    placeholder={"Internal notes (never shown to affiliates)"}
                    value={value}
                    onChange={onChange}
                    helperText={error?.message}
                  />
                )}
                name="notes"
                control={control}
              />
            </div>
          </div>
        </MuiModal>
      )}

      {revealedKey?.open && (
        <ApiKeyRevealModal
          open={true}
          apiKey={revealedKey?.apiKey}
          message={revealedKey?.message}
          onClose={() =>
            setRevealedKey({ open: false, apiKey: null, message: null })
          }
        />
      )}

      {openDetail?.open && (
        <SuperAffiliateDetail
          id={openDetail?.data}
          onClose={() => setOpenDetail({ open: false, data: null })}
          onChanged={getSupers}
        />
      )}
    </Card>
  );
};

export default SuperAffiliatesList;
