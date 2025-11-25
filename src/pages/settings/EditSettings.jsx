import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Card, IconButton, InputLabel } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FormInput } from "../../Components/form-component/FormComponent";
import NoDataFound from "../../Components/shared/fallbacks/no-data-found/NoDataFound";
import FormsSkeletons from "../../Components/shared/skeletons/FormsSkeletons";
import { getAllSettings, updateSettings } from "../../core/apis/settingsAPI";
import { useSelector } from "react-redux";
import MuiModal from "../../Components/Modals/MuiModal";

const schema = yup.object().shape({
  settings: yup.array().of(
    yup.object().shape({
      key: yup.string().required().nullable(false),
      value: yup.string().required().nullable(false),
    })
  ),
});

const EditSettings = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.authentication);

  const [deletedItems, setDeletedItems] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    control,
    getValues,
    errors,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),

    defaultValues: {},
    mode: "all",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "settings",
  });

  useEffect(() => {
    setIsLoading(true);
    getAllSettings()
      .then((res) => {
        if (!res?.error) {
          setData(res?.data);

          reset({ settings: res.data });
          setDeletedItems([]);
        } else {
          setData(null);
          toast.error(res?.error);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [reset]);

  const handleSubmitForm = (payload) => {
    setIsSubmitting(true);

    const settingsPayload =
      payload?.settings?.map((setting) => {
        return {
          key: setting.key,
          value: setting?.value?.trim() || "",
        };
      }) || [];

    updateSettings(settingsPayload, data, deletedItems, user, isDirty)
      .then((res) => {
        if (!res?.error) {
          toast.success(`Settings edited successfully`);
          navigate(-1);
        } else {
          toast.error(res?.error || "An error occured");
        }
      })
      .finally(() => {
        setIsSubmitting(false);
        setConfirmOpen(false);
      })
      .catch((error) => {
        toast.error(error?.message || "An error occured");
      });
  };

  const onConfirmSubmit = () => {
    const payload = getValues();
    setConfirmOpen(false);
    handleSubmitForm(payload);
  };

  if (loading) {
    return <FormsSkeletons />;
  }
  if (!loading && !data) {
    return <NoDataFound text="Failed to load settings" />;
  }

  return (
    <Card>
      <form
        className={"flex flex-col p-6 gap-[1rem] sm:w-[80%]"}
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmOpen(true);
        }}
      >
        <div className="flex flex-col gap-[1rem]">
          <div className={"flex flex-row justify-between"}>
            <h1>{fields?.length} Configured Settings</h1>
            <div
              className={"flex flex-row gap-[0.5rem] justify-end items-center"}
            >
              <Button
                variant={"contained"}
                color="secondary"
                type={"button"}
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                variant={"outlined"}
                color="secondary"
                type={"button"}
                onClick={() => {
                  setDeletedItems([]);
                  reset();
                }}
              >
                Reset
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
          </div>

          {fields?.map((item, index) => (
            <div
              key={item?.id}
              className="flex flex-row gap-2 w-full items-center"
            >
              {/* Key Field */}
              <div className="flex flex-col gap-1 flex-1">
                <InputLabel>Key</InputLabel>
                <Controller
                  name={`settings.${index}.key`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormInput
                      {...field}
                      placeholder="Enter key"
                      disabled={item?.created_at}
                      helperText={error?.message}
                    />
                  )}
                />
              </div>

              {/* Value Field */}
              <div className="flex flex-col gap-1 flex-1">
                <InputLabel>Value</InputLabel>
                <Controller
                  name={`settings.${index}.value`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormInput
                      {...field}
                      placeholder="Enter value"
                      helperText={error?.message}
                    />
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row  justify-center items-center w-[60px]">
                {/* Add Button (only functional for first row) */}

                {/* Remove Button */}
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => {
                    if (item?.created_at) {
                      setDeletedItems([...deletedItems, item?.key]);
                    }

                    remove(index);
                  }}
                  disabled={fields.length === 1}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => append({ key: "", value: "" })}
                  className={index !== fields?.length - 1 ? "invisible" : ""}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </form>
      {confirmOpen && (
        <MuiModal
          open={true}
          onClose={() => setConfirmOpen(false)}
          title={"Notice!"}
          onConfirm={() => onConfirmSubmit()}
        >
          <p className={"text-center"}>
            Are you sure you want to save the changes?
          </p>
        </MuiModal>
      )}
    </Card>
  );
};

export default EditSettings;
