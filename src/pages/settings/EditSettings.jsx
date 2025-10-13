import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Card } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FormInput } from "../../Components/form-component/FormComponent";
import NoDataFound from "../../Components/shared/fallbacks/no-data-found/NoDataFound";
import FormsSkeletons from "../../Components/shared/skeletons/FormsSkeletons";
import { getAllSettings, updateSettings } from "../../core/apis/settingsAPI";

const createDynamicSchema = (settingsData) => {
  if (!settingsData || !Array.isArray(settingsData)) {
    return yup.object().shape({});
  }

  const schemaFields = {};

  settingsData.forEach((setting) => {
    if (setting.key) {
      const fieldName = setting.key.toLowerCase();

      schemaFields[fieldName] = yup
        .string()
        .label(
          setting.key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
        )
        .required(`${setting.key.replace(/_/g, " ")} is required`)
        .nullable()
        .test(
          "not-only-spaces",
          `${setting.key.replace(/_/g, " ")} cannot be only spaces`,
          (value) => value == null || value.trim().length > 0
        );
    }
  });

  return yup.object().shape(schemaFields);
};

const EditSettings = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicSchema, setDynamicSchema] = useState(yup.object().shape({}));

  const form = useForm({
    defaultValues: {},
    mode: "all",
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    if (dynamicSchema) {
      form.resolver = yupResolver(dynamicSchema);
    }
  }, [dynamicSchema, form]);

  useEffect(() => {
    setIsLoading(true);
    getAllSettings()
      .then((res) => {
        if (!res?.error) {
          setData(res?.data);

          const schema = createDynamicSchema(res?.data);
          setDynamicSchema(schema);

          const defaultValues = {};
          res?.data?.forEach((setting) => {
            if (setting.key) {
              const fieldName = setting.key.toLowerCase();
              defaultValues[fieldName] = setting.value || "";
            }
          });

          reset(defaultValues);
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
      data?.map((setting) => {
        const fieldName = setting.key.toLowerCase();
        return {
          key: setting.key,
          value: payload[fieldName] || "",
        };
      }) || [];

    updateSettings(settingsPayload)
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
      })
      .catch((error) => {
        toast.error(error?.message || "An error occured");
      });
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
        className={"flex flex-col p-6 gap-[1rem]"}
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <div
          className={
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1rem]"
          }
        >
          {data?.map((setting) => {
            const fieldName = setting.key.toLowerCase();
            const displayName = setting.key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());

            return (
              <div key={setting.key} className={"w-full"}>
                <label>{displayName}* </label>
                <Controller
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormInput
                      placeholder={`Enter ${displayName}`}
                      value={value || ""}
                      onChange={(value) => {
                        onChange(value);
                      }}
                      helperText={error?.message}
                    />
                  )}
                  name={fieldName}
                  control={control}
                />
              </div>
            );
          })}
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

export default EditSettings;
