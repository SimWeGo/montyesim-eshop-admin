import LinkOffIcon from "@mui/icons-material/LinkOff";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FormInput } from "../../Components/form-component/FormComponent";
import ConfirmActionModal from "../../Components/Modals/ConfirmActionModal";
import MuiModal from "../../Components/Modals/MuiModal";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import {
  attachSub,
  detachSub,
  getAllAffiliatesRest,
  getSuperAffiliateById,
  updateNetworkRate,
} from "../../core/apis/superAffiliatesAPI";
import { useIsSuperAdmin } from "../../core/hoc/WithSuperAdminOnly";
import { formatRate } from "../../core/helpers/formatCurrency";

const emptyToNull = (value, original) =>
  original === "" || original === null ? null : value;

// AttachSubRequest (§A3) : S requis (REDÉFINI au cutover §8.8),
// P optionnel (null = P actuel conservé), reactivate_promo défaut true
const attachSchema = yup.object().shape({
  sub: yup.object().label("Affiliate").required().nullable(),
  sub_commission_rate: yup
    .number()
    .label("Sub commission (S)")
    .transform(emptyToNull)
    .min(0)
    .max(100)
    .required()
    .nullable(),
  promo_rate: yup
    .number()
    .label("Promo rate (P)")
    .transform(emptyToNull)
    .min(0)
    .max(100)
    .nullable(),
  reactivate_promo: yup.boolean().nullable(),
});

// ------------------------------------------------ Dialog de rattachement
const AttachSubDialog = ({ superId, networkRate, onClose, onAttached }) => {
  const theme = useTheme();
  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Cache de la liste REST (pas de pagination serveur, §A7)
  const candidatesCache = useRef(null);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      sub: null,
      sub_commission_rate: null,
      promo_rate: null,
      reactivate_promo: true,
    },
    resolver: yupResolver(attachSchema),
    mode: "all",
  });

  // Candidats : NI super, NI déjà parenté (SUB_ALREADY_ATTACHED sinon).
  // Le label expose la promo actuelle — un candidat sans promo sera refusé
  // par le back (SUB_HAS_NO_PROMO) : créer sa promo d'abord.
  const loadCandidateOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;
    if (!candidatesCache.current) {
      const res = await getAllAffiliatesRest();
      if (res?.error) {
        toast.error(res?.error);
        return {
          options: [...(loadedOptions || [])],
          hasMore: false,
          additional: { page },
        };
      }
      candidatesCache.current = res?.data || [];
    }
    const q = search?.trim()?.toLowerCase();
    const eligible = candidatesCache.current.filter(
      (el) =>
        !el?.is_super_affiliate &&
        !el?.parent_affiliate_id &&
        (!q ||
          el?.name?.toLowerCase()?.includes(q) ||
          el?.email?.toLowerCase()?.includes(q))
    );
    const from = (page - 1) * pageSize;
    const slice = eligible.slice(from, from + pageSize);
    return {
      options: slice.map((el) => ({
        ...el,
        value: el?.id,
        label: `${el?.name} — promo ${el?.promo_code || "NONE"}${
          el?.promo_amount != null ? ` (P=${el?.promo_amount}%)` : ""
        }`,
      })),
      hasMore: from + pageSize < eligible.length,
      additional: { page: page + 1 },
    };
  };

  // Aperçu M = N − P − S (P demandé, sinon P actuel du candidat)
  const sub = watch("sub");
  const p = watch("promo_rate") ?? sub?.promo_amount ?? 0;
  const s = watch("sub_commission_rate") ?? 0;
  const m = Number(networkRate ?? 0) - Number(p || 0) - Number(s || 0);

  const handleAttach = (payload) => {
    setIsSubmitting(true);
    attachSub(superId, {
      sub_affiliate_id: payload?.sub?.value,
      sub_commission_rate: Number(payload?.sub_commission_rate),
      promo_rate:
        payload?.promo_rate === null || payload?.promo_rate === undefined
          ? null
          : Number(payload?.promo_rate),
      reactivate_promo: Boolean(payload?.reactivate_promo),
    })
      .then((res) => {
        if (res?.error) {
          // errorCode machine-stable (R-PROMO, split, collision… §A1)
          toast.error(
            res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
          );
        } else {
          toast.success("Affiliate attached to the network successfully");
          onAttached();
        }
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <MuiModal
      open={true}
      onClose={onClose}
      title={"Attach an affiliate to this network"}
      confirmButtonName={isSubmitting ? "Submitting..." : "Attach"}
      onConfirm={handleSubmit(handleAttach)}
    >
      <div className={"flex flex-col gap-[1rem]"}>
        <Alert severity="info">
          Cutover: the current SimWeGo↔affiliate commission does NOT carry
          over — S is redefined by the network. The promo code never changes.
          A frozen promo is reactivated unless unchecked below.
        </Alert>
        <div>
          <label>Affiliate* </label>
          <Controller
            render={({ field: { onChange, value } }) => (
              <AsyncPaginate
                inputId="sub-select"
                isClearable
                value={value || null}
                loadOptions={loadCandidateOptions}
                placeholder="Select affiliate (no parent, not super)"
                onChange={onChange}
                additional={{ page: 1 }}
                isSearchable
                debounceTimeout={300}
                styles={asyncPaginateStyles}
                menuPortalTarget={
                  typeof window !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
              />
            )}
            name="sub"
            control={control}
          />
        </div>
        <div className={"flex flex-wrap gap-[1rem]"}>
          <div className={"flex-1 min-w-[150px]"}>
            <label>Sub commission (S)* </label>
            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormInput
                  type={"number"}
                  placeholder={"Enter S"}
                  value={value}
                  onChange={onChange}
                  helperText={error?.message}
                  endAdornment={"%"}
                />
              )}
              name="sub_commission_rate"
              control={control}
            />
          </div>
          <div className={"flex-1 min-w-[150px]"}>
            <label>Promo rate (P) </label>
            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormInput
                  type={"number"}
                  placeholder={"Empty = keep current P"}
                  value={value}
                  onChange={onChange}
                  helperText={error?.message}
                  endAdornment={"%"}
                />
              )}
              name="promo_rate"
              control={control}
            />
          </div>
        </div>
        <Controller
          render={({ field: { onChange, value } }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(value)}
                  onChange={(e) => onChange(e.target.checked)}
                />
              }
              label="Reactivate promo code if frozen"
            />
          )}
          name="reactivate_promo"
          control={control}
        />
        {sub && (
          <Alert severity={m < 0 ? "error" : "success"}>
            {`Split preview: N=${formatRate(networkRate)} − P=${formatRate(
              p
            )} − S=${formatRate(s)} → super margin M=${formatRate(m)}${
              m < 0 ? " — P + S exceeds N, the API will reject it" : ""
            }`}
          </Alert>
        )}
      </div>
    </MuiModal>
  );
};

// ------------------------------------------------------- Vue détail super
const SuperAffiliateDetail = ({ id, onClose, onChanged }) => {
  const isSuperAdmin = useIsSuperAdmin();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rateForm, setRateForm] = useState({
    rate: "",
    notes: "",
    submitting: false,
  });
  // Conflits cascade du PATCH network-rate (422 structuré, §A6)
  const [conflicts, setConflicts] = useState([]);
  const [openAttach, setOpenAttach] = useState(false);
  const [detach, setDetach] = useState({
    open: false,
    sub: null,
    submitting: false,
  });

  const fetchDetail = () => {
    setLoading(true);
    getSuperAffiliateById(id)
      .then((res) => {
        if (res?.error) {
          toast.error(res?.error);
          setDetail(null);
        } else {
          setDetail(res?.data);
          setRateForm((prev) => ({
            ...prev,
            rate: res?.data?.network_commission_rate ?? "",
          }));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpdateRate = () => {
    const n = Number(rateForm?.rate);
    if (rateForm?.rate === "" || Number.isNaN(n) || n <= 0 || n > 100) {
      toast.error("Network rate must be greater than 0 and at most 100");
      return;
    }
    setRateForm((prev) => ({ ...prev, submitting: true }));
    setConflicts([]);
    updateNetworkRate(id, {
      network_commission_rate: n,
      notes: rateForm?.notes || null,
    })
      .then((res) => {
        if (res?.errorCode === "SPLIT_EXCEEDS_NETWORK_RATE") {
          // 422 STRUCTURÉ : rien n'a été appliqué, data.conflicts liste
          // les subs dont P+S > nouveau N (validation cascade §8.3)
          setConflicts(res?.data?.conflicts || []);
          toast.error(
            res?.error || "Some sub-affiliates exceed the new network rate"
          );
        } else if (res?.error) {
          toast.error(res?.error);
        } else {
          toast.success(
            `Network rate updated: ${formatRate(
              res?.data?.old_rate
            )} → ${formatRate(res?.data?.new_rate)}`
          );
          fetchDetail();
          onChanged?.();
        }
      })
      .finally(() => setRateForm((prev) => ({ ...prev, submitting: false })));
  };

  const handleDetach = () => {
    setDetach((prev) => ({ ...prev, submitting: true }));
    detachSub(id, detach?.sub?.id)
      .then((res) => {
        if (res?.error) {
          toast.error(
            res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
          );
          setDetach((prev) => ({ ...prev, submitting: false }));
        } else {
          // DetachResultDTO : rappelle explicitement le gel (§A3)
          toast.success(
            `Sub detached — promo ${
              res?.data?.frozen_promo_code || "N/A"
            } frozen, rate review pending`
          );
          setDetach({ open: false, sub: null, submitting: false });
          fetchDetail();
          onChanged?.();
        }
      });
  };

  const subsHeaders = [
    { name: "Name" },
    { name: "Promo Code" },
    { name: "P" },
    { name: "S" },
    { name: "Margin (M)" },
    { name: "Rate Review" },
    { name: "Status" },
  ];

  return (
    <MuiModal
      open={true}
      onClose={onClose}
      size="xl"
      title={`Super-affiliate — ${detail?.name || ""}`}
      displayButtons={false}
    >
      {loading ? (
        <div className={"flex justify-center items-center h-[200px]"}>
          <CircularProgress color="primary" />
        </div>
      ) : !detail ? (
        <p className={"text-center"}>Super-affiliate not found</p>
      ) : (
        <div className={"flex flex-col gap-[1.5rem]"}>
          {/* ---- Infos réseau */}
          <div className={"flex flex-row flex-wrap gap-[0.5rem] items-center"}>
            <Chip
              size="small"
              color="primary"
              label={`N = ${formatRate(detail?.network_commission_rate)}`}
            />
            <Chip
              size="small"
              color={detail?.is_active ? "success" : "default"}
              label={detail?.is_active ? "Active" : "Inactive"}
            />
            {detail?.api_key_last_4 && (
              <Chip size="small" label={`API key ••••${detail?.api_key_last_4}`} />
            )}
            {detail?.email && <Chip size="small" label={detail?.email} />}
            {detail?.company_name && (
              <Chip size="small" label={detail?.company_name} />
            )}
          </div>
          {detail?.notes && (
            <p className={"text-sm"}>Internal notes: {detail?.notes}</p>
          )}

          {/* ---- Patch N (ARGENT — super_admin) */}
          {isSuperAdmin && (
            <div className={"flex flex-col gap-[0.5rem]"}>
              <div className="flex items-center">
                <div className="w-[20px] h-px bg-gray-300" />
                <h6 className="px-2">Network rate (N)</h6>
                <div className="w-[20px] h-px bg-gray-300" />
              </div>
              <div className={"flex flex-wrap gap-[1rem] items-end"}>
                <div className={"flex-1 min-w-[150px]"}>
                  <label>New rate (%) </label>
                  <FormInput
                    type={"number"}
                    placeholder={"Enter new N"}
                    value={rateForm?.rate}
                    onChange={(value) =>
                      setRateForm({ ...rateForm, rate: value })
                    }
                    endAdornment={"%"}
                  />
                </div>
                <div className={"flex-[2] min-w-[200px]"}>
                  <label>Reason / notes </label>
                  <FormInput
                    placeholder={"Logged in the rate change audit trail"}
                    value={rateForm?.notes}
                    onChange={(value) =>
                      setRateForm({ ...rateForm, notes: value })
                    }
                  />
                </div>
                <Button
                  variant={"contained"}
                  color="primary"
                  disabled={rateForm?.submitting}
                  onClick={handleUpdateRate}
                >
                  {rateForm?.submitting ? "Updating..." : "Update rate"}
                </Button>
              </div>

              {/* Conflits cascade (§8.3) : rien n'est appliqué tant que
                  tous les subs ne rentrent pas sous le nouveau N */}
              {conflicts?.length > 0 && (
                <>
                  <Alert severity="error">
                    Nothing was applied. {conflicts?.length} sub-affiliate(s)
                    exceed the requested rate — lower their P/S first (or pick
                    a higher N):
                  </Alert>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sub</TableCell>
                          <TableCell>Promo Code</TableCell>
                          <TableCell>P</TableCell>
                          <TableCell>S</TableCell>
                          <TableCell>P + S</TableCell>
                          <TableCell>Max allowed (new N)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {conflicts?.map((c) => (
                          <TableRow key={c?.sub_affiliate_id}>
                            <TableCell>{c?.sub_name}</TableCell>
                            <TableCell>{c?.promo_code || "N/A"}</TableCell>
                            <TableCell>{formatRate(c?.promo_rate)}</TableCell>
                            <TableCell>
                              {formatRate(c?.commission_rate)}
                            </TableCell>
                            <TableCell className={"font-bold"}>
                              {formatRate(c?.p_plus_s)}
                            </TableCell>
                            <TableCell>{formatRate(c?.max_allowed)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </div>
          )}

          {/* ---- Subs */}
          <div className={"flex flex-col gap-[0.5rem]"}>
            <div
              className={"flex flex-row justify-between items-center gap-[1rem]"}
            >
              <div className="flex items-center">
                <div className="w-[20px] h-px bg-gray-300" />
                <h6 className="px-2">
                  Sub-affiliates ({detail?.subs?.length || 0})
                </h6>
                <div className="w-[20px] h-px bg-gray-300" />
              </div>
              {isSuperAdmin && (
                <Button
                  variant={"contained"}
                  color="primary"
                  size="small"
                  startIcon={<PersonAddAlt1Icon />}
                  onClick={() => setOpenAttach(true)}
                >
                  Attach affiliate
                </Button>
              )}
            </div>

            <TableComponent
              loading={false}
              tableData={detail?.subs || []}
              tableHeaders={subsHeaders}
              actions={false}
              noDataFound={"No sub-affiliate in this network yet"}
            >
              {detail?.subs?.map((sub) => (
                // actions={false} : le bouton detach vit dans la cellule
                // Status (pas de colonne actions vide)
                <RowComponent key={sub?.id} actions={false}>
                  <TableCell className={"max-w-[200px] truncate"}>
                    {sub?.name || "N/A"}
                  </TableCell>
                  <TableCell className={"whitespace-nowrap"}>
                    {sub?.promo_code || "N/A"}
                    {sub?.promo_is_active === false && (
                      <Chip
                        size="small"
                        color="warning"
                        label="Frozen"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {sub?.promo_rate != null
                      ? formatRate(sub?.promo_rate)
                      : "N/A"}
                  </TableCell>
                  <TableCell>{formatRate(sub?.commission_rate)}</TableCell>
                  <TableCell>
                    {sub?.margin_rate != null
                      ? formatRate(sub?.margin_rate)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {sub?.requires_rate_review ? (
                      <Chip size="small" color="error" label="Pending" />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={sub?.is_active ? "success" : "default"}
                      label={sub?.is_active ? "Active" : "Inactive"}
                    />
                    {/* Detach = ARGENT + gel promo (§8.6) → super_admin */}
                    {isSuperAdmin && (
                      <Tooltip title={"Detach from network"} placement={"top"}>
                        <IconButton
                          color="error"
                          aria-label="detach"
                          onClick={() =>
                            setDetach({
                              open: true,
                              sub: sub,
                              submitting: false,
                            })
                          }
                        >
                          <LinkOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </RowComponent>
              ))}
            </TableComponent>
          </div>
        </div>
      )}

      {openAttach && (
        <AttachSubDialog
          superId={id}
          networkRate={detail?.network_commission_rate}
          onClose={() => setOpenAttach(false)}
          onAttached={() => {
            setOpenAttach(false);
            fetchDetail();
            onChanged?.();
          }}
        />
      )}

      {/* Détachement : 2 étapes, rappel EXPLICITE du gel §8.6 */}
      {detach?.open && (
        <ConfirmActionModal
          open={true}
          onClose={() =>
            setDetach({ open: false, sub: null, submitting: false })
          }
          onConfirm={handleDetach}
          submitting={detach?.submitting}
          title={"Detach sub-affiliate"}
          confirmButtonName={"Detach now"}
          warning={
            <div className={"flex flex-col gap-[0.5rem]"}>
              <Alert severity="warning">
                Detaching{" "}
                <span className={"font-bold"}>{detach?.sub?.name}</span> will
                immediately{" "}
                <span className={"font-bold"}>
                  FREEZE its promo code
                  {detach?.sub?.promo_code ? ` (${detach?.sub?.promo_code})` : ""}
                </span>
                : no new promo sales and no commission accrual until an admin
                validates a new independent rate (Rate Review on the
                Affiliates page) or re-attaches it to a network.
              </Alert>
              <p className={"text-sm"}>
                Already earned commissions are kept in the ledger and remain
                payable to the current network.
              </p>
            </div>
          }
          summary={
            <p className={"text-center"}>
              Detach <span className={"font-bold"}>{detach?.sub?.name}</span>{" "}
              from <span className={"font-bold"}>{detail?.name}</span> and
              freeze its promo now?
            </p>
          }
        />
      )}
    </MuiModal>
  );
};

export default SuperAffiliateDetail;
