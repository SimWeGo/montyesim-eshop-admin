import { yupResolver } from "@hookform/resolvers/yup";
import { Check, Info } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
import { useDebouncedCallback } from "use-debounce";
import * as yup from "yup";
import {
  FormDateRange,
  FormInput,
} from "../../Components/form-component/FormComponent";
import NoDataFound from "../../Components/shared/fallbacks/no-data-found/NoDataFound";
import FormsSkeletons from "../../Components/shared/skeletons/FormsSkeletons";
import { getAllBundlesDropdown } from "../../core/apis/bundlesAPI";
import {
  AddPromotion,
  checkCodeUnique,
  checkNameUnique,
  editPromotion,
  getPromotionById,
} from "../../core/apis/promotionsAPI";
import { getAllRulesDropdown } from "../../core/apis/rulesAPI";
import { DefaultCurrency } from "../../core/vairables/EnumData";
const schema = yup.object().shape({
  name: yup
    .string()
    .label("Name")
    .max(30)
    .min(2)
    .required()
    .nullable()
    .test(
      "not-only-spaces",
      "Name cannot be only spaces",
      (value) => value == null || value.trim().length > 0
    ),
  code: yup
    .string()
    .label("Code")
    .min(2)
    .max(30)
    .required()
    .nullable()
    .test(
      "not-only-spaces",
      "Code cannot be only spaces",
      (value) => value == null || value.trim().length > 0
    ),
  rule_id: yup.object().label("Rule").required().nullable(),
  amount: yup
    .number()
    .label("Value")
    .required()
    .nullable()
    .min(1, "Value must be at least 1")
    .when("rule_id", {
      is: (value) =>
        value?.promotion_rule_action?.name
          ?.toLowerCase()
          ?.includes("percentage"),
      then: (schema) => schema.max(100, "Value must be at most 100"),
      otherwise: (schema) => schema,
    }),
  duration: yup
    .array()
    .nullable()
    .label("Duration")
    .required("Duration is required")
    .length(2, "Duration must have exactly 2 elements")
    .test("at-least-one", "From or To is required", (value) => {
      if (!Array.isArray(value)) return false;
      const [from, to] = value;
      return from == null || to == null ? false : true;
    }),
  bundle_code: yup.array().label("Bundles").nullable().max(5),
  /* EXPLANATION : The limit of 5 items is based on each UUID being 36 characters long plus 4 commas separating them,
 fitting within the database varchar field limit of 200 characters.*/
});

const HandlePromotions = () => {
  const theme = useTheme();
  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [nameUnique, setNameUnique] = useState({
    loading: false,
    check: false,
    message: "",
  });
  const [codeUnique, setCodeUnique] = useState({
    loading: false,
    check: false,
    message: "",
  });
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,

    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      code: "",
      rule_id: null,
      amount: null,
      valid_from: "",
      valid_to: "",
      bundle_code: [],
    },
    resolver: yupResolver(schema),
    mode: "all",
  });

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getPromotionById(id)
        .then((res) => {
          if (!res?.error) {
            setData(res?.data);
            reset({
              name: res?.data?.name || "",
              code: res?.data?.code || "",
              rule_id: {
                ...res?.data?.promotion_rule,
                value: res?.data?.rule_id,
                label: `${res?.data?.promotion_rule?.promotion_rule_action?.name}/${res?.data?.promotion_rule?.promotion_rule_event?.name}/${res?.data?.promotion_rule?.max_usage}`,
              },
              amount: res?.data?.amount || null,
              duration: [res?.data?.valid_from, res?.data?.valid_to],
              bundle_code:
                res?.data?.bundle_code !== ""
                  ? res?.data?.bundle_code?.split(",")?.map((el) => {
                      return { value: el, label: el };
                    })
                  : [],
            });
            checkNameUniqueness(res?.data?.name, id);
            checkCodeUniqueness(res?.data?.code, id);
          } else {
            setData(null);
            toast.error(res?.error);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const handleSubmitForm = (payload) => {
    if (codeUnique?.check && nameUnique?.check) {
      setIsSubmitting(true);
      let handleAPI = id ? editPromotion : AddPromotion;

      const { duration, ...rest } = payload;
      handleAPI({
        ...rest,
        rule_id: payload?.rule_id?.id,
        valid_from: new Date(payload?.duration?.[0]),
        valid_to: new Date(payload?.duration?.[1]),
        bundle_code:
          payload?.bundle_code?.length === 0
            ? null
            : payload?.bundle_code?.map((el) => el?.value)?.join(","),
        type: "Promo",
        ...(id && { id: id }),
      })
        .then((res) => {
          if (!res?.error) {
            toast.success(`Promotion ${id ? "edited" : "added"} successfully`);
            navigate(-1);
          } else {
            toast.error(res?.error || "An error occured");
          }
        })
        .finally(() => {
          setIsSubmitting(false);
        })
        .catch((error) => {
          toast.error(error?.message || "An error occured");
        });
    } else {
      toast.error("Code & Name must be unique");
    }
  };

  const debouncedName = useDebouncedCallback(
    (value) => {
      checkNameUniqueness(value, id);
    },

    500
  );

  const checkNameUniqueness = (value, id) => {
    setNameUnique({
      ...nameUnique,
      loading: true,
    });
    if (errors?.name) {
      setNameUnique({
        check: false,
        message: errors?.name?.message,
        loading: false,
      });
    } else {
      checkNameUnique(value, id).then((res) => {
        setNameUnique({
          check: res?.status == 200 && res?.data?.length === 0,
          message:
            res?.data?.length !== 0
              ? "Name is not unique"
              : res?.error || "Name is unique",
          loading: false,
        });
      });
    }
  };
  const checkCodeUniqueness = (value, id) => {
    setCodeUnique({
      ...codeUnique,
      loading: true,
    });

    if (errors?.code) {
      setCodeUnique({
        check: false,
        message: errors?.code?.message,
        loading: false,
      });
    } else {
      checkCodeUnique(value, id).then((res) => {
        setCodeUnique({
          check: res?.status == 200 && res?.data?.length === 0,
          message:
            res?.data?.length !== 0
              ? "Code is not unique"
              : res?.error || "Code is unique",
          loading: false,
        });
      });
    }
  };
  const debouncedCode = useDebouncedCallback(
    (value) => {
      checkCodeUniqueness(value, id);
    },

    500
  );

  const valueUnit = useMemo(() => {
    let checkRule = watch("rule_id");
    if (!checkRule) return "";
    if (!checkRule) return "Amount/Percentage";

    if (
      checkRule?.promotion_rule_action?.name?.toLowerCase()?.includes("amount")
    )
      return DefaultCurrency;
    return "%";
  }, [watch("rule_id")]);

  const label = useMemo(() => {
    let checkRule = watch("rule_id");
    if (!checkRule) return "Amount/Percentage";

    if (
      checkRule?.promotion_rule_action?.name?.toLowerCase()?.includes("amount")
    )
      return "Amount";
    return "Percentage";
  }, [watch("rule_id")]);

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

  const loadBundlesOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;

    const res = await getAllBundlesDropdown({ page, pageSize, search });
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

  if (id && loading) {
    return <FormsSkeletons />;
  }
  if (!loading && !data && id) {
    return <NoDataFound text="Invalid Promotion ID" />;
  }
  if (error) {
    return (
      <Card>
        <CardContent>
          {" "}
          <NoDataFound
            text={"Invalid ID or group data not loaded. Please try again"}
          />
        </CardContent>
      </Card>
    );
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
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormInput
                  placeholder={"Enter Name"}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    debouncedName(value);
                  }}
                  helperText={error?.message}
                  endAdornment={
                    value && (
                      <Tooltip title={nameUnique?.message}>
                        {nameUnique?.loading ? (
                          <CircularProgress
                            size="20px"
                            color="primary"
                            sx={{ cursor: "default" }}
                          />
                        ) : nameUnique?.check ? (
                          <Check color="success" sx={{ cursor: "default" }} />
                        ) : (
                          <CloseIcon color="error" sx={{ cursor: "default" }} />
                        )}
                      </Tooltip>
                    )
                  }
                />
              )}
              name="name"
              control={control}
            />
          </div>
          <div className={"flex-1 min-w-[200px]"}>
            <label>Code* </label>
            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormInput
                  placeholder={"Enter Code"}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    debouncedCode(value);
                  }}
                  disabled={id}
                  endAdornment={
                    value && (
                      <Tooltip title={codeUnique?.message}>
                        {codeUnique?.loading ? (
                          <CircularProgress
                            size="20px"
                            color="primary"
                            sx={{ cursor: "default" }}
                          />
                        ) : codeUnique?.check ? (
                          <Check color="success" sx={{ cursor: "default" }} />
                        ) : (
                          <CloseIcon color="error" sx={{ cursor: "default" }} />
                        )}
                      </Tooltip>
                    )
                  }
                  helperText={error?.message}
                />
              )}
              name="code"
              control={control}
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[20px] h-px bg-gray-300" />
          <h6 className="px-2">Rule & Duration</h6>
          <div className="w-[20px] h-px bg-gray-300" />
        </div>
        <div className={"flex flex-wrap gap-[1rem]"}>
          <div className={"flex-1 min-w-[200px]"}>
            <label>Rule* </label>
            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <AsyncPaginate
                  inputId="group-select"
                  isClearable
                  value={value || null}
                  loadOptions={loadRuleOptions}
                  placeholder="Select Rule"
                  onChange={(value) => {
                    onChange(value);
                    setValue("amount", null, {
                      shouldValidate: true,
                    });
                  }}
                  isDisabled={id}
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
              name="rule_id"
              control={control}
            />
            {errors?.rule_id?.message !== "" && (
              <FormHelperText>{errors?.rule_id?.message}</FormHelperText>
            )}
          </div>
          <div className={"flex-1 min-w-[200px]"}>
            <label>{label}* </label>
            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormInput
                  type={"number"}
                  placeholder={"Enter Value"}
                  value={value || null}
                  onChange={(value) => {
                    onChange(!value ? null : value);
                  }}
                  disabled={id}
                  helperText={error?.message}
                  endAdornment={valueUnit}
                />
              )}
              name="amount"
              control={control}
            />
          </div>

          <div className={"flex-1 min-w-[200px]"}>
            <label>Duration* </label>
            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormDateRange
                  placeholder={"Select Duration"}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                  }}
                  disabled={id}
                  helperText={error?.message}
                />
              )}
              name="duration"
              control={control}
            />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-[20px] h-px bg-gray-300" />
          <h6 className="px-2">Application</h6>
          <div className="w-[20px] h-px bg-gray-300" />
        </div>
        <div className={"flex flex-wrap gap-[1rem]"}>
          <div className={"flex-1 min-w-[200px]"}>
            <label className={"flex flex-row items-center"}>
              Bundles{" "}
              <Tooltip
                title={`If no bundle is selected, the promotion will be applied to all bundles`}
              >
                <span className={"cursor-pointer"}>
                  <Info fontSize="small" />
                </span>
              </Tooltip>
            </label>
            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <AsyncPaginate
                  inputId="group-select"
                  isClearable
                  isMulti
                  value={value}
                  loadOptions={loadBundlesOptions}
                  placeholder="Select Bundle"
                  onChange={onChange}
                  additional={{ page: 1 }}
                  isSearchable
                  debounceTimeout={300}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                  styles={asyncPaginateStyles}
                />
              )}
              name="bundle_code"
              control={control}
            />
            {errors?.bundle_code?.message !== "" && (
              <FormHelperText>{errors?.bundle_code?.message}</FormHelperText>
            )}
          </div>
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
    </Card>
  );
};

export default HandlePromotions;
