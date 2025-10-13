import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import {
  FormDate,
  FormInput,
} from "../../../../Components/form-component/FormComponent";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import { DefaultCurrency } from "../../../../core/vairables/EnumData";
import { useDebouncedCallback } from "use-debounce";
import {
  addVoucher,
  checkVoucherCodeUnique,
} from "../../../../core/apis/vouchersAPI";
import { Check } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  code: yup.string().trim().required("Code name is required"),
  amount: yup
    .number()
    .typeError("Amount must be a number")
    .positive("Amount must be positive")
    .required("Amount is required"),
  expired_at: yup
    .string()
    .trim()
    .nullable()
    .required("Expiry date is required")
    .test(
      "is-today-or-future",
      "Expiry date must be today or later",
      (value) => {
        if (!value) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(value);
        return inputDate >= today;
      }
    ),
});

export default function VoucherForm({ voucher = null, onSuccess, OnCancel }) {
  const [codeUnique, setCodeUnique] = useState({
    loading: false,
    check: false,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      code: voucher?.code || "",
      amount: voucher?.amount || "",
      expired_at: voucher?.expired_at || "",
    },
  });

  const checkCodeUniqueness = (value) => {
    setCodeUnique((prev) => ({
      ...prev,
      loading: true,
    }));

    if (errors?.code) {
      setCodeUnique({
        check: false,
        message: errors?.code?.message,
        loading: false,
      });
    } else {
      checkVoucherCodeUnique(value).then((res) => {
        setCodeUnique({
          check: res?.status == 200 && res?.data?.length === 0,
          message: res?.data?.length !== 0 ? "Code is not unique" : res?.error,
          loading: false,
        });
      });
    }
  };

  const debouncedCode = useDebouncedCallback((value) => {
    checkCodeUniqueness(value);
  }, 500);

  const onSubmit = (data) => {
    if (codeUnique?.check) {
      setIsSubmitting(true);
      const { code, amount, expired_at } = data;

      addVoucher({
        code,
        amount,
        expired_at,
      })
        .then((res) => {
          if (!res?.error) {
            toast.success("Voucher created successfully");
            onSuccess && onSuccess(data);
          } else {
            toast.error(res?.error || "Failed to insert voucher");
          }
        })
        .catch((err) => {
          toast.error(
            err?.message || "An error occurred while inserting voucher"
          );
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  const OnClose = () => {
    OnCancel && OnCancel();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 w-full"
    >
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-200">
          Code
        </label>
        <Controller
          name="code"
          control={control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <FormInput
              placeholder="Enter Code"
              value={value}
              onChange={(val) => {
                onChange(val);
                if (val.trim()) {
                  debouncedCode(val);
                }
              }}
              helperText={error?.message || codeUnique?.message}
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
            />
          )}
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-200">
          Amount
        </label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <FormInput
              {...field}
              placeholder="Enter amount"
              type="number"
              endAdornment={DefaultCurrency}
              helperText={errors.amount?.message}
            />
          )}
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-200">
          Expire At
        </label>
        <Controller
          name="expired_at"
          control={control}
          render={({ field }) => (
            <FormDate
              {...field}
              placeholder="Select expiry date"
              helperText={errors.expired_at?.message}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="contained" color="secondary" onClick={OnClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isSubmitting || !codeUnique?.check}
          startIcon={
            isSubmitting && <CircularProgress size={18} color="inherit" />
          }
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
