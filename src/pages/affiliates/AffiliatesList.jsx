import AutorenewIcon from "@mui/icons-material/Autorenew";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SearchIcon from "@mui/icons-material/Search";
import {
  Card,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid2,
  IconButton,
  Switch,
  TableCell,
  TablePagination,
  TextField,
  Tooltip,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import { FormInput } from "../../Components/form-component/FormComponent";
import ApiKeyRevealModal from "../../Components/Modals/ApiKeyRevealModal";
import ConfirmActionModal from "../../Components/Modals/ConfirmActionModal";
import MuiModal from "../../Components/Modals/MuiModal";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import {
  clearRateReview,
  getAllAffiliatesRest,
  regenerateAffiliateApiKey,
  updateAffiliateRest,
} from "../../core/apis/superAffiliatesAPI";
import { useIsSuperAdmin } from "../../core/hoc/WithSuperAdminOnly";
import { formatRate } from "../../core/helpers/formatCurrency";

const AffiliatesList = () => {
  const navigate = useNavigate();
  const isSuperAdmin = useIsSuperAdmin();
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState([]);
  const [search, setSearch] = useState("");
  // GET /admin/affiliates renvoie la liste COMPLÈTE (pas de pagination
  // serveur, §A7) → recherche + pagination CLIENT. searchQueries garde la
  // forme du gabarit promotions pour rester homogène.
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    page: 0,
    pageSize: 10,
  });
  const [rotateKey, setRotateKey] = useState({
    open: false,
    data: null,
    submitting: false,
  });
  const [revealedKey, setRevealedKey] = useState({
    open: false,
    apiKey: null,
    message: null,
  });
  const [review, setReview] = useState({
    open: false,
    data: null,
    rate: "",
    reactivate: false,
    submitting: false,
  });

  const getAffiliates = () => {
    setLoading(true);
    getAllAffiliatesRest()
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
    getAffiliates();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQueries?.name?.trim()?.toLowerCase();
    if (!q) return allData;
    return allData?.filter((el) =>
      [el?.name, el?.email, el?.promo_code]?.some((v) =>
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
    { name: "Type" },
    { name: "Promo Code" },
    { name: "Promo %" },
    { name: "Commission %" },
    { name: "API Key" },
    { name: "Rate Review" },
    { name: "Status" },
  ];

  // Type réseau dérivé des champs Sprint 5 du DTO liste (§A3)
  const typeChip = (el) => {
    if (el?.is_super_affiliate)
      return <Chip size="small" color="secondary" label="Super" />;
    if (el?.parent_affiliate_id)
      return <Chip size="small" color="info" label="Sub" />;
    return <Chip size="small" variant="outlined" label="Independent" />;
  };

  const handleToggleStatus = (el) => {
    updateAffiliateRest(el?.id, { is_active: !el?.is_active }).then((res) => {
      if (!res?.error) {
        toast.success("Affiliate status updated successfully");
        getAffiliates();
      } else {
        toast.error(res?.error);
      }
    });
  };

  const handleRotateKey = () => {
    setRotateKey((prev) => ({ ...prev, submitting: true }));
    regenerateAffiliateApiKey(rotateKey?.data?.id)
      .then((res) => {
        if (res?.error) {
          toast.error(res?.error);
        } else {
          // Clé one-shot (§A7) : affichée UNE seule fois
          setRevealedKey({
            open: true,
            apiKey: res?.data?.api_key,
            message: res?.data?.message,
          });
          getAffiliates();
        }
      })
      .finally(() =>
        setRotateKey({ open: false, data: null, submitting: false })
      );
  };

  // Sortie de revue §8.6 : taux indépendant validé + option dégel promo
  const handleClearReview = () => {
    const rate = Number(review?.rate);
    if (review?.rate === "" || Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Validated rate must be between 0 and 100");
      return;
    }
    setReview((prev) => ({ ...prev, submitting: true }));
    clearRateReview(review?.data?.id, {
      new_commission_rate: rate,
      reactivate_promo: review?.reactivate,
    })
      .then((res) => {
        if (res?.error) {
          toast.error(
            res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
          );
        } else {
          toast.success("Rate review cleared — affiliate is now independent");
          setReview({
            open: false,
            data: null,
            rate: "",
            reactivate: false,
            submitting: false,
          });
          getAffiliates();
        }
      })
      .finally(() => setReview((prev) => ({ ...prev, submitting: false })));
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
                placeholder="Search by name, email or promo code"
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
        onAdd={() => navigate("/affiliates/add")}
      >
        {paginated?.map((el) => (
          <RowComponent
            key={el?.id}
            actions={true}
            onEdit={() => navigate(`/affiliates/${el?.id}`)}
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
            <TableCell>{typeChip(el)}</TableCell>
            <TableCell>{el?.promo_code || "N/A"}</TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {el?.promo_amount != null ? formatRate(el?.promo_amount) : "N/A"}
              {/* Promo gelée au détachement (§8.6) */}
              {el?.promo_is_active === false && (
                <Chip
                  size="small"
                  color="warning"
                  label="Frozen"
                  sx={{ ml: 1 }}
                />
              )}
            </TableCell>
            <TableCell>{formatRate(el?.commission_rate)}</TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {el?.api_key_last_4 ? `••••${el?.api_key_last_4}` : "N/A"}
              <Tooltip title={"Rotate API key"} placement={"top"}>
                <IconButton
                  color="primary"
                  aria-label="rotate-key"
                  onClick={() =>
                    setRotateKey({ open: true, data: el, submitting: false })
                  }
                >
                  <AutorenewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {el?.requires_rate_review ? (
                <>
                  <Chip size="small" color="error" label="Pending" />
                  {/* ARGENT : clear-rate-review réouvre le flux de
                      commission → bouton réservé super_admin (D5) */}
                  {isSuperAdmin && (
                    <Tooltip
                      title={"Validate rate (clear review)"}
                      placement={"top"}
                    >
                      <IconButton
                        color="primary"
                        aria-label="clear-review"
                        onClick={() =>
                          setReview({
                            open: true,
                            data: el,
                            rate: el?.commission_rate ?? "",
                            reactivate: false,
                            submitting: false,
                          })
                        }
                      >
                        <FactCheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell sx={{ minWidth: "100px" }}>
              <Switch
                color="success"
                checked={el?.is_active}
                onChange={() => handleToggleStatus(el)}
                name="is_active"
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

      {/* Rotation de clé : 2 étapes — invalidation IMMÉDIATE de l'ancienne */}
      {rotateKey?.open && (
        <ConfirmActionModal
          open={true}
          onClose={() =>
            setRotateKey({ open: false, data: null, submitting: false })
          }
          onConfirm={handleRotateKey}
          submitting={rotateKey?.submitting}
          title={"Rotate API key"}
          confirmButtonName={"Rotate key now"}
          warning={
            <p className={"text-center"}>
              The current API key of{" "}
              <span className={"font-bold"}>{rotateKey?.data?.name}</span> will
              be <span className={"font-bold"}>immediately invalidated</span>.
              Any integration still using it will stop working. The new key is
              shown <span className={"font-bold"}>only once</span>.
            </p>
          }
          summary={
            <p className={"text-center"}>
              Rotate the API key of{" "}
              <span className={"font-bold"}>{rotateKey?.data?.name}</span> now?
            </p>
          }
        />
      )}

      {/* Sortie de revue §8.6 */}
      {review?.open && (
        <MuiModal
          open={true}
          onClose={() =>
            setReview({
              open: false,
              data: null,
              rate: "",
              reactivate: false,
              submitting: false,
            })
          }
          title={"Validate rate — clear review"}
          confirmButtonName={review?.submitting ? "Submitting..." : "Validate"}
          onConfirm={handleClearReview}
        >
          <div className={"flex flex-col gap-[1rem]"}>
            <p>
              <span className={"font-bold"}>{review?.data?.name}</span> was
              detached from its network (its promo code is frozen and
              commission accrual is stopped). Set the validated independent
              commission rate to re-open the flow.
            </p>
            <div>
              <label>Validated commission rate (%)*</label>
              <FormInput
                type={"number"}
                placeholder={"Enter validated rate"}
                value={review?.rate}
                onChange={(value) => setReview({ ...review, rate: value })}
                endAdornment={"%"}
              />
            </div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={review?.reactivate}
                  onChange={(e) =>
                    setReview({ ...review, reactivate: e.target.checked })
                  }
                />
              }
              label={`Reactivate frozen promo code${
                review?.data?.promo_code ? ` (${review?.data?.promo_code})` : ""
              }`}
            />
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
    </Card>
  );
};

export default AffiliatesList;
