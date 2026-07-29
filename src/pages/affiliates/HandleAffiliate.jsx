import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FormInput } from "../../Components/form-component/FormComponent";
import ApiKeyRevealModal from "../../Components/Modals/ApiKeyRevealModal";
import NoDataFound from "../../Components/shared/fallbacks/no-data-found/NoDataFound";
import FormsSkeletons from "../../Components/shared/skeletons/FormsSkeletons";
import {
  createAffiliateRest,
  getAffiliateByIdRest,
  getAllSuperAffiliates,
  updateAffiliateRest,
} from "../../core/apis/superAffiliatesAPI";
import { useIsSuperAdmin } from "../../core/hoc/WithSuperAdminOnly";
import { formatRate } from "../../core/helpers/formatCurrency";

// FormInput type=number renvoie "" quand vidé → null pour yup
const emptyToNull = (value, original) =>
  original === "" || original === null ? null : value;

const buildSchema = (isEdit) =>
  yup.object().shape({
    name: yup.string().label("Name").min(2).max(60).required().nullable(),
    email: yup.string().label("Email").email().nullable(),
    company_name: yup.string().label("Company").max(100).nullable(),
    // Affiché sur le bandeau partenaire de la boutique (AffiliateBanner)
    logo_url: yup.string().label("Logo URL").url().max(500).nullable(),
    contact_phone: yup.string().label("Phone").max(30).nullable(),
    commission_rate: yup
      .number()
      .label("Commission rate")
      .transform(emptyToNull)
      .min(0)
      .max(100)
      .required()
      .nullable(),
    promo_code: isEdit
      ? yup.string().nullable()
      : yup.string().label("Promo code").min(2).max(30).required().nullable(),
    promo_amount: isEdit
      ? yup
          .number()
          .label("Promo discount")
          .transform(emptyToNull)
          .min(0)
          .max(100)
          .nullable()
      : yup
          .number()
          .label("Promo discount")
          .transform(emptyToNull)
          .min(0)
          .max(100)
          .required()
          .nullable(),
    parent_super: yup.object().label("Super-affiliate").nullable(),
    notes: yup.string().label("Notes").max(500).nullable(),
    is_active: yup.boolean().nullable(),
  });

const HandleAffiliate = () => {
  const theme = useTheme();
  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isSuperAdmin = useIsSuperAdmin();
  const [data, setData] = useState(null);
  const [loading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedKey, setRevealedKey] = useState({
    open: false,
    apiKey: null,
    message: null,
  });
  // Cache de la liste des supers (REST sans pagination serveur)
  const supersCache = useRef(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      company_name: "",
      contact_phone: "",
      logo_url: "",
      commission_rate: 10,
      promo_code: "",
      promo_amount: 5,
      parent_super: null,
      notes: "",
      is_active: true,
    },
    resolver: yupResolver(buildSchema(isEdit)),
    mode: "all",
  });

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      // GET /admin/affiliates/{id} → AffiliateModel complet (§A7)
      getAffiliateByIdRest(id)
        .then((res) => {
          if (!res?.error && res?.data) {
            setData(res?.data);
            reset({
              name: res?.data?.name || "",
              email: res?.data?.email || "",
              company_name: res?.data?.company_name || "",
              contact_phone: res?.data?.contact_phone || "",
              logo_url: res?.data?.logo_url || "",
              commission_rate: res?.data?.commission_rate ?? 0,
              promo_code: res?.data?.promo_code || "",
              // Prefill du % promo (P) — édition réservée aux directs (#9)
              promo_amount: res?.data?.promo_amount ?? null,
              parent_super: null,
              notes: res?.data?.notes || "",
              is_active: res?.data?.is_active ?? true,
            });
          } else {
            setData(null);
            toast.error(res?.error || "Invalid Affiliate ID");
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Dropdown des supers actifs — filtre + tranche CLIENT (cf. B10 intro)
  const loadSuperOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;
    if (!supersCache.current) {
      const res = await getAllSuperAffiliates();
      if (res?.error) {
        toast.error(res?.error);
        return {
          options: [...(loadedOptions || [])],
          hasMore: false,
          additional: { page },
        };
      }
      supersCache.current = res?.data || [];
    }
    const q = search?.trim()?.toLowerCase();
    const eligible = supersCache.current.filter(
      (el) => el?.is_active && (!q || el?.name?.toLowerCase()?.includes(q))
    );
    const from = (page - 1) * pageSize;
    const slice = eligible.slice(from, from + pageSize);
    return {
      options: slice.map((el) => ({
        ...el,
        value: el?.id,
        label: `${el?.name} (N=${el?.network_commission_rate}%)`,
      })),
      hasMore: from + pageSize < eligible.length,
      additional: { page: page + 1 },
    };
  };

  // Aperçu marge M = N − P − S quand un parent est choisi (le back
  // re-valide : _validate_split AVANT toute écriture, §A7)
  const marginPreview = useMemo(() => {
    const parent = watch("parent_super");
    if (!parent) return null;
    const n = Number(parent?.network_commission_rate ?? 0);
    const p = Number(watch("promo_amount") ?? 0);
    const s = Number(watch("commission_rate") ?? 0);
    return { n, p, s, m: n - p - s };
  }, [watch("parent_super"), watch("promo_amount"), watch("commission_rate")]);

  const handleSubmitForm = (payload) => {
    setIsSubmitting(true);
    const base = {
      name: payload?.name?.trim(),
      email: payload?.email || null,
      company_name: payload?.company_name || null,
      logo_url: payload?.logo_url || null,
      contact_phone: payload?.contact_phone || null,
      commission_rate: Number(payload?.commission_rate),
      notes: payload?.notes || null,
    };

    if (!isEdit) {
      createAffiliateRest({
        ...base,
        promo_code: payload?.promo_code?.trim(),
        promo_amount: Number(payload?.promo_amount),
        // ARGENT (D5) : le back exige super_admin quand fourni (§A7)
        parent_super_affiliate_id: payload?.parent_super?.value || null,
      })
        .then((res) => {
          if (res?.error) {
            toast.error(
              res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
            );
          } else {
            // Clé one-shot : navigate(-1) SEULEMENT à la fermeture du modal
            setRevealedKey({
              open: true,
              apiKey: res?.data?.api_key,
              message: res?.data?.message,
            });
          }
        })
        .finally(() => setIsSubmitting(false));
    } else {
      // % promo (P) éditable seulement pour un affilié DIRECT ; le back
      // refuse de toute façon pour une agence réseau (USE_NETWORK_RATE_FLOW).
      const isDirect =
        !data?.parent_affiliate_id && !data?.is_super_affiliate;
      const editPayload = { ...base, is_active: payload?.is_active };
      if (isDirect && payload?.promo_amount != null && payload?.promo_amount !== "") {
        editPayload.promo_amount = Number(payload?.promo_amount);
      }
      updateAffiliateRest(id, editPayload)
        .then((res) => {
          if (res?.error) {
            toast.error(
              res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
            );
          } else {
            toast.success("Affiliate edited successfully");
            navigate(-1);
          }
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  if (id && loading) {
    return <FormsSkeletons />;
  }
  if (!loading && !data && id) {
    return <NoDataFound text="Invalid Affiliate ID" />;
  }

  return (
    <Card>
      <form
        className={"flex flex-col p-6 gap-[1rem]"}
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <div className="flex items-center">
          <div className="w-[20px] h-px bg-gray-300" />
          <h6 className="px-2">Main Info</h6>
          <div className="w-[20px] h-px bg-gray-300" />
        </div>

        <div className={"flex flex-wrap gap-[1rem]"}>
          <div className={"flex-1 min-w-[200px]"}>
            <label>Name* </label>
            <Controller
              render={({ field: { onChange, value }, fieldState: { error } }) => (
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
          <div className={"flex-1 min-w-[200px]"}>
            <label>Email </label>
            <Controller
              render={({ field: { onChange, value }, fieldState: { error } }) => (
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
          <div className={"flex-1 min-w-[200px]"}>
            <label>Company </label>
            <Controller
              render={({ field: { onChange, value }, fieldState: { error } }) => (
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
          <div className={"flex-1 min-w-[200px]"}>
            <label>Phone </label>
            <Controller
              render={({ field: { onChange, value }, fieldState: { error } }) => (
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
          <div className={"flex-1 min-w-[200px]"}>
            <label>Logo URL </label>
            <Controller
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FormInput
                  placeholder={"https://… (shown on the shop partner banner)"}
                  value={value}
                  onChange={onChange}
                  helperText={
                    error?.message ||
                    "Recommended image size: 1200 × 600 px (shown on the shop partner banner)"
                  }
                />
              )}
              name="logo_url"
              control={control}
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[20px] h-px bg-gray-300" />
          <h6 className="px-2">Commission{!isEdit && " & Promo"}</h6>
          <div className="w-[20px] h-px bg-gray-300" />
        </div>

        <div className={"flex flex-wrap gap-[1rem]"}>
          <div className={"flex-1 min-w-[200px]"}>
            <label>Commission rate (S)* </label>
            <Controller
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FormInput
                  type={"number"}
                  placeholder={"Enter commission rate"}
                  value={value}
                  onChange={onChange}
                  helperText={error?.message}
                  endAdornment={"%"}
                />
              )}
              name="commission_rate"
              control={control}
            />
          </div>
          {!isEdit && (
            <>
              <div className={"flex-1 min-w-[200px]"}>
                <label>Promo code* </label>
                <Controller
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormInput
                      placeholder={"Enter promo code"}
                      value={value}
                      onChange={onChange}
                      helperText={error?.message}
                    />
                  )}
                  name="promo_code"
                  control={control}
                />
              </div>
              <div className={"flex-1 min-w-[200px]"}>
                <label>Promo discount (P)* </label>
                <Controller
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormInput
                      type={"number"}
                      placeholder={"Enter promo discount"}
                      value={value}
                      onChange={onChange}
                      helperText={error?.message}
                      endAdornment={"%"}
                    />
                  )}
                  name="promo_amount"
                  control={control}
                />
              </div>
            </>
          )}
          {/* Édition : le % de réduction (P) — directs uniquement (#9). Pour
              une agence réseau, P est géré au niveau du réseau (P+S ≤ N). */}
          {isEdit &&
            (!data?.parent_affiliate_id && !data?.is_super_affiliate ? (
              <div className={"flex-1 min-w-[200px]"}>
                <label>Promo discount (P) </label>
                <Controller
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormInput
                      type={"number"}
                      placeholder={"Enter promo discount"}
                      value={value ?? ""}
                      onChange={onChange}
                      helperText={
                        error?.message ||
                        (data?.promo_code
                          ? `Client discount of code ${data.promo_code}`
                          : "Client discount %")
                      }
                      endAdornment={"%"}
                    />
                  )}
                  name="promo_amount"
                  control={control}
                />
              </div>
            ) : data?.is_super_affiliate ? null : (
              <div className={"flex-1 min-w-[200px] flex items-end"}>
                <p className={"text-sm text-gray-500 pb-2"}>
                  Client discount (P) is managed at the network level — edit it
                  from the super-affiliate page.
                </p>
              </div>
            ))}
        </div>

        {/* Rattachement direct à la création — super_admin uniquement
            (§A7 : le back re-vérifie le rôle ET valide le split avant
            toute écriture) */}
        {!isEdit && isSuperAdmin && (
          <>
            <div className="flex items-center">
              <div className="w-[20px] h-px bg-gray-300" />
              <h6 className="px-2">Network (optional)</h6>
              <div className="w-[20px] h-px bg-gray-300" />
            </div>
            <div className={"flex flex-wrap gap-[1rem]"}>
              <div className={"flex-1 min-w-[200px]"}>
                <label>Attach to super-affiliate </label>
                <Controller
                  render={({ field: { onChange, value } }) => (
                    <AsyncPaginate
                      inputId="super-select"
                      isClearable
                      value={value || null}
                      loadOptions={loadSuperOptions}
                      placeholder="Select super-affiliate (optional)"
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
                  name="parent_super"
                  control={control}
                />
                {marginPreview && (
                  <FormHelperText error={marginPreview?.m < 0}>
                    {`Split preview: N=${formatRate(marginPreview?.n)} − P=${formatRate(
                      marginPreview?.p
                    )} − S=${formatRate(marginPreview?.s)} → super margin M=${formatRate(
                      marginPreview?.m
                    )}${marginPreview?.m < 0 ? " — P + S exceeds N, the API will reject it" : ""}`}
                  </FormHelperText>
                )}
              </div>
            </div>
          </>
        )}

        <div className={"flex flex-wrap gap-[1rem]"}>
          <div className={"flex-1 min-w-[200px]"}>
            <label>Notes </label>
            <Controller
              render={({ field: { onChange, value }, fieldState: { error } }) => (
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
          {isEdit && (
            <div className={"flex-1 min-w-[200px] flex items-end"}>
              <Controller
                render={({ field: { onChange, value } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(value)}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                )}
                name="is_active"
                control={control}
              />
            </div>
          )}
        </div>

        <div className={"flex flex-row gap-[0.5rem] justify-end items-center"}>
          <Button
            variant={"contained"}
            color="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={"contained"}
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>

      {/* Clé one-shot après création — retour liste à la fermeture */}
      {revealedKey?.open && (
        <ApiKeyRevealModal
          open={true}
          apiKey={revealedKey?.apiKey}
          message={revealedKey?.message}
          onClose={() => {
            setRevealedKey({ open: false, apiKey: null, message: null });
            toast.success("Affiliate added successfully");
            navigate(-1);
          }}
        />
      )}
    </Card>
  );
};

export default HandleAffiliate;
