import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Switch,
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

// --- Webstore co-brandé (étape 5) — mêmes règles que le backend ---
const WS_HEX_RE = /^#[0-9a-fA-F]{6}$/;
const WS_SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;
const WS_RESERVED = ["www", "api", "app", "admin", "affiliate", "mail"];
const WS_LANGUAGES = ["en", "fr", "es", "nl", "ar"];

// Intertitre de sous-groupe du panneau Webstore
const WsGroupLabel = ({ children }) => (
  <p className={"text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-2 mb-0"}>
    {children}
  </p>
);

// Champ couleur : pipette native synchronisée avec le champ texte #RRGGBB
const ColorField = ({ name, label, control }) => (
  <div className={"flex-1 min-w-[200px]"}>
    <label>{label} </label>
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className={"flex flex-row items-start gap-[0.5rem]"}>
          <input
            type="color"
            aria-label={`${label} picker`}
            value={WS_HEX_RE.test(value || "") ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className={"mt-1 h-[38px] w-[46px] cursor-pointer rounded border border-gray-300 bg-white p-0.5"}
          />
          <div className={"flex-1"}>
            <FormInput
              placeholder={"#RRGGBB (empty = default)"}
              value={value}
              onChange={onChange}
              helperText={error?.message}
            />
          </div>
        </div>
      )}
    />
  </div>
);

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
    // --- Webstore co-brandé (édition seulement ; le back re-valide tout) ---
    ws_enabled: yup.boolean().nullable(),
    ws_display_name: yup.string().label("Display name").max(60).nullable(),
    ws_tab_title: yup.string().label("Tab title").max(60).nullable(),
    ws_primary_color: yup.string().matches(WS_HEX_RE, {
      excludeEmptyString: true, message: "Expected #RRGGBB" }).nullable(),
    ws_secondary_color: yup.string().matches(WS_HEX_RE, {
      excludeEmptyString: true, message: "Expected #RRGGBB" }).nullable(),
    ws_background_color: yup.string().matches(WS_HEX_RE, {
      excludeEmptyString: true, message: "Expected #RRGGBB" }).nullable(),
    ws_logo_url: yup.string().matches(/^https:\/\/.+/, {
      excludeEmptyString: true, message: "https:// URL expected" }).max(500).nullable(),
    ws_header_image_url: yup.string().matches(/^https:\/\/.+/, {
      excludeEmptyString: true, message: "https:// URL expected" }).max(500).nullable(),
    ws_favicon_url: yup.string().matches(/^https:\/\/.+/, {
      excludeEmptyString: true, message: "https:// URL expected" }).max(500).nullable(),
    ws_subdomain: yup.string()
      .notOneOf(WS_RESERVED, "Reserved subdomain")
      .matches(WS_SUBDOMAIN_RE, {
        excludeEmptyString: true,
        message: "Lowercase letters, digits and dashes only",
      })
      .nullable(),
    ws_default_language: yup.string().oneOf(["", ...WS_LANGUAGES, null]).nullable(),
    ws_default_currency: yup.string().matches(/^[A-Z]{3}$/, {
      excludeEmptyString: true, message: "ISO code expected (e.g. EUR)" }).nullable(),
    ws_guide_ios_url: yup.string().matches(/^https:\/\/.+/, {
      excludeEmptyString: true, message: "https:// URL expected" }).max(500).nullable(),
    ws_guide_android_url: yup.string().matches(/^https:\/\/.+/, {
      excludeEmptyString: true, message: "https:// URL expected" }).max(500).nullable(),
  });

// Objet thème envoyé au PATCH : "" efface la clé côté backend (merge)
const buildWsTheme = (payload) => ({
  enabled: Boolean(payload?.ws_enabled),
  display_name: payload?.ws_display_name?.trim() || "",
  tab_title: payload?.ws_tab_title?.trim() || "",
  primary_color: payload?.ws_primary_color?.trim() || "",
  secondary_color: payload?.ws_secondary_color?.trim() || "",
  background_color: payload?.ws_background_color?.trim() || "",
  logo_url: payload?.ws_logo_url?.trim() || "",
  header_image_url: payload?.ws_header_image_url?.trim() || "",
  favicon_url: payload?.ws_favicon_url?.trim() || "",
  subdomain: payload?.ws_subdomain?.trim()?.toLowerCase() || "",
  default_language: payload?.ws_default_language || "",
  default_currency: payload?.ws_default_currency?.trim()?.toUpperCase() || "",
  guide_ios_url: payload?.ws_guide_ios_url?.trim() || "",
  guide_android_url: payload?.ws_guide_android_url?.trim() || "",
});

// Un thème « vide » (tout à ""/false) ne justifie pas de PATCH post-création
const wsThemeHasContent = (t) =>
  t.enabled || Object.values(t).some((v) => v !== "" && v !== false);

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
      ws_enabled: false,
      ws_display_name: "",
      ws_tab_title: "",
      ws_primary_color: "",
      ws_secondary_color: "",
      ws_background_color: "",
      ws_logo_url: "",
      ws_header_image_url: "",
      ws_favicon_url: "",
      ws_subdomain: "",
      ws_default_language: "",
      ws_default_currency: "",
      ws_guide_ios_url: "",
      ws_guide_android_url: "",
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
              // Thème webstore : préremplissage depuis le jsonb (étape 5)
              ws_enabled: Boolean(res?.data?.webstore_theme?.enabled),
              ws_display_name: res?.data?.webstore_theme?.display_name || "",
              ws_tab_title: res?.data?.webstore_theme?.tab_title || "",
              ws_primary_color: res?.data?.webstore_theme?.primary_color || "",
              ws_secondary_color: res?.data?.webstore_theme?.secondary_color || "",
              ws_background_color: res?.data?.webstore_theme?.background_color || "",
              ws_logo_url: res?.data?.webstore_theme?.logo_url || "",
              ws_header_image_url: res?.data?.webstore_theme?.header_image_url || "",
              ws_favicon_url: res?.data?.webstore_theme?.favicon_url || "",
              ws_subdomain: res?.data?.webstore_theme?.subdomain || "",
              ws_default_language: res?.data?.webstore_theme?.default_language || "",
              ws_default_currency: res?.data?.webstore_theme?.default_currency || "",
              ws_guide_ios_url: res?.data?.webstore_theme?.guide_ios_url || "",
              ws_guide_android_url: res?.data?.webstore_theme?.guide_android_url || "",
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
        .then(async (res) => {
          if (res?.error) {
            toast.error(
              res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
            );
          } else {
            // Thème webstore saisi à la création → PATCH dans la foulée
            // (l'endpoint create ne le porte pas). Un échec ici n'empêche
            // JAMAIS l'affichage de la clé one-shot.
            const wsTheme = buildWsTheme(payload);
            if (res?.data?.affiliate_id && wsThemeHasContent(wsTheme)) {
              const themeRes = await updateAffiliateRest(
                res.data.affiliate_id,
                { webstore_theme: wsTheme }
              );
              if (themeRes?.error) {
                toast.warning(
                  `Affiliate created, but the webstore theme was not saved` +
                    (themeRes?.errorCode ? ` [${themeRes.errorCode}]` : "") +
                    ` — edit the affiliate to retry.`
                );
              }
            }
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
      // Thème webstore : objet complet — "" efface la clé côté back (merge),
      // les valeurs préremplies non touchées sont renvoyées telles quelles.
      editPayload.webstore_theme = buildWsTheme(payload);
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

        {/* ---------- Webstore co-brandé (étape 5) — création ET édition ---------- */}
        <div className={"rounded-lg border border-gray-200 overflow-hidden"}>
          {/* En-tête du panneau : titre + interrupteur d'activation */}
          <div className={"flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3 border-b border-gray-200"}>
            <div>
              <h6 className={"m-0"}>Co-branded shop</h6>
              <p className={"m-0 text-xs text-gray-500"}>
                Shop in the partner&apos;s colors — applies immediately after
                saving, clients still need the affiliate promo link.
              </p>
            </div>
            <Controller
              name="ws_enabled"
              control={control}
              render={({ field: { onChange, value } }) => (
                <FormControlLabel
                  className={"m-0"}
                  control={
                    <Switch
                      checked={Boolean(value)}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  }
                  label={value ? "Enabled" : "Disabled"}
                />
              )}
            />
          </div>

          {/* Champs visibles uniquement quand le webstore est activé */}
          {watch("ws_enabled") ? (
            <div className={"flex flex-col gap-[0.75rem] p-4"}>
              <WsGroupLabel>Identity</WsGroupLabel>
              <div className={"flex flex-wrap gap-[1rem]"}>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Display name </label>
                  <Controller
                    name="ws_display_name"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"Shown in the shop header"}
                        value={value}
                        onChange={onChange}
                        helperText={error?.message}
                      />
                    )}
                  />
                </div>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Browser tab title </label>
                  <Controller
                    name="ws_tab_title"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"e.g. Yupwego eSIM"}
                        value={value}
                        onChange={onChange}
                        helperText={error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <WsGroupLabel>Brand colors</WsGroupLabel>
              <div className={"flex flex-wrap gap-[1rem]"}>
                <ColorField name="ws_primary_color" label="Primary" control={control} />
                <ColorField name="ws_secondary_color" label="Secondary" control={control} />
                <ColorField name="ws_background_color" label="Background" control={control} />
              </div>

              <WsGroupLabel>Images</WsGroupLabel>
              <div className={"flex flex-wrap gap-[1rem]"}>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Shop logo URL </label>
                  <Controller
                    name="ws_logo_url"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"https://…"}
                        value={value}
                        onChange={onChange}
                        helperText={error?.message || "Replaces the SimWeGo logo"}
                      />
                    )}
                  />
                </div>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Header image URL </label>
                  <Controller
                    name="ws_header_image_url"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"https://…"}
                        value={value}
                        onChange={onChange}
                        helperText={
                          error?.message ||
                          "Full-width hero photo — 1920 × 640 px recommended"
                        }
                      />
                    )}
                  />
                </div>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Favicon URL </label>
                  <Controller
                    name="ws_favicon_url"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"https://…/favicon.png"}
                        value={value}
                        onChange={onChange}
                        helperText={error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <WsGroupLabel>Settings</WsGroupLabel>
              <div className={"flex flex-wrap gap-[1rem]"}>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Subdomain </label>
                  <Controller
                    name="ws_subdomain"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"e.g. yupwego"}
                        value={value}
                        onChange={onChange}
                        helperText={
                          error?.message ||
                          "Reserved for later — subdomains are not live yet"
                        }
                      />
                    )}
                  />
                </div>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Default language </label>
                  <Controller
                    name="ws_default_language"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <select
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={"mt-1 h-[38px] w-full rounded border border-gray-300 bg-white px-2"}
                      >
                        <option value="">— shop default —</option>
                        {WS_LANGUAGES.map((l) => (
                          <option key={l} value={l}>
                            {l.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Default currency </label>
                  <Controller
                    name="ws_default_currency"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"e.g. EUR"}
                        value={value}
                        onChange={onChange}
                        helperText={error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <WsGroupLabel>Client guides (purchase email)</WsGroupLabel>
              <div className={"flex flex-wrap gap-[1rem]"}>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>iOS guide PDF URL </label>
                  <Controller
                    name="ws_guide_ios_url"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"https://…/guide-ios.pdf"}
                        value={value}
                        onChange={onChange}
                        helperText={
                          error?.message ||
                          "“iOS guide” button in the purchase email"
                        }
                      />
                    )}
                  />
                </div>
                <div className={"flex-1 min-w-[200px]"}>
                  <label>Android guide PDF URL </label>
                  <Controller
                    name="ws_guide_android_url"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormInput
                        placeholder={"https://…/guide-android.pdf"}
                        value={value}
                        onChange={onChange}
                        helperText={
                          error?.message ||
                          "“Android guide” button in the purchase email"
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className={"m-0 px-4 py-3 text-sm text-gray-400"}>
              Turn it on to configure colors, logo and hero image. Saved
              values are kept when disabled.
            </p>
          )}
        </div>

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
