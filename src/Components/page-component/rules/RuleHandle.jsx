import React, { useEffect, useState } from "react";
import { Close } from "@mui/icons-material";
import { Button, Dialog, DialogContent, IconButton } from "@mui/material";
import {
  FormDropdownList,
  FormInput,
} from "../../form-component/FormComponent";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { beneficiaryData } from "../../../core/vairables/EnumData";
import {
  AddRule,
  editRule,
  getAllActions,
  getAllEvents,
} from "../../../core/apis/rulesAPI";
import { toast } from "react-toastify";

const validationSchema = yup.object({
  promotion_rule_action_id: yup.object().required().nullable().label("Action"),
  promotion_rule_event_id: yup.object().required().nullable().label("Event"),
  max_usage: yup
    .number()
    .required()
    .nullable()
    .typeError("Max Usage must be a number")
    .integer("Max Usage must be an integer")
    .label("Max Usage")
    .min(1)
    .max(2147483647),

  beneficiary: yup.object().required().nullable().label("Beneficiary"),

  /*beneficiary is only for referral code and not for promo , in the backend there is default rule for referral
  taken from that table*/
});

const RuleHandle = ({ onClose, data = null, refetch }) => {
  const [actions, setActions] = useState([]);
  const [events, setEvents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      promotion_rule_action_id: null,
      promotion_rule_event_id: null,
      max_usage: null,
      beneficiary: null,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const getActionsData = () => {
    getAllActions().then((res) => {
      if (res?.status == 200) {
        setActions(res?.data);
      }
    });
  };

  const getEventsData = () => {
    getAllEvents().then((res) => {
      if (res?.status == 200) {
        setEvents(res?.data);
      }
    });
  };

  useEffect(() => {
    if (data) {
      reset({
        promotion_rule_action_id: data?.promotion_rule_action,
        promotion_rule_event_id: data?.promotion_rule_event,
        max_usage: data?.max_usage,
        beneficiary: beneficiaryData?.find((el) => el?.id == data?.beneficiary),
      });
    }
    getActionsData();
    getEventsData();
  }, []);

  const handleSubmitForm = (payload) => {
    setIsSubmitting(true);
    let handleAPI = data ? editRule : AddRule;
    handleAPI({
      ...payload,
      beneficiary: payload?.beneficiary?.id,
      promotion_rule_action_id: payload?.promotion_rule_action_id?.id,
      promotion_rule_event_id: payload?.promotion_rule_event_id?.id,
      ...(data && { id: data?.id }),
    })
      .then((res) => {
        if (res?.status >= 200 && res?.status < 300) {
          toast.success(`Rule ${data ? "edited" : "added"} successfully`);
          refetch();
          onClose();
        } else {
          toast.error(res?.error);
        }
      })
      .catch((error) => {
        toast.error(error?.message || "Failed to save rule");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogContent className="flex flex-col gap-[1rem] xs:!px-8 !py-10 justify-start">
        <div className={"flex flex-row justify-end"}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={() =>
              localStorage.getItem("i18nextLng") === "ar"
                ? {
                    position: "absolute",
                    left: 8,
                    top: 8,
                    color: "black",
                  }
                : {
                    position: "absolute",
                    right: 8,
                    top: 8,
                    color: "black",
                  }
            }
          >
            <Close />
          </IconButton>
        </div>
        <form
          className={"mt-2 flex flex-col gap-[1rem]"}
          onSubmit={handleSubmit(handleSubmitForm)}
        >
          <h1 className={"text-start"}>{data ? "Edit Rule" : "Add Rule"}</h1>
          <div className={"grid grid-cols-1 md:grid-cols-2 gap-2"}>
            <div className={"label-input-wrapper"}>
              <label>Action*</label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormDropdownList
                    placeholder={"Select Action"}
                    value={value || null}
                    data={actions || []}
                    helperText={error?.message}
                    accessName={"name"}
                    onChange={(value) => onChange(value)}
                    disabled={data}
                  />
                )}
                name="promotion_rule_action_id"
                control={control}
              />
            </div>
            <div className={"label-input-wrapper"}>
              <label>Event*</label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormDropdownList
                    placeholder={"Select Event"}
                    value={value || null}
                    data={events || []}
                    helperText={error?.message}
                    accessName={"name"}
                    onChange={(value) => onChange(value)}
                    disabled={data}
                  />
                )}
                name="promotion_rule_event_id"
                control={control}
              />
            </div>
            <div className={"label-input-wrapper"}>
              <label>Max Usage*</label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormInput
                    type="number"
                    placeholder={"Enter Max Usage"}
                    value={value}
                    helperText={error?.message}
                    onChange={(value) => onChange(!value ? null : value)}
                    disabled={data}
                  />
                )}
                name="max_usage"
                control={control}
              />
            </div>
            <div className={"label-input-wrapper"}>
              <label>Beneficiary*</label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormDropdownList
                    placeholder={"Select beneficiary"}
                    value={value || null}
                    data={beneficiaryData}
                    helperText={error?.message}
                    accessName={"title"}
                    onChange={(value) => onChange(value)}
                  />
                )}
                name="beneficiary"
                control={control}
              />
            </div>
          </div>

          <div
            className={"flex flex-row gap-[0.5rem] justify-end items-center"}
          >
            <Button
              variant={"contained"}
              color="secondary"
              onClick={() => onClose()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant={"contained"}
              sx={{ width: "fit-content", alignSelf: "end" }}
              color="primary"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RuleHandle;
