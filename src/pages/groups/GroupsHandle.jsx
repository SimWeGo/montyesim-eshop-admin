import { yupResolver } from "@hookform/resolvers/yup";
import { Add, Info, Remove } from "@mui/icons-material";
import { Button, Card, CardContent, IconButton, Tooltip } from "@mui/material";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useDebouncedCallback } from "use-debounce";
import * as yup from "yup";
import {
  FormAvatarEditor,
  FormDropdownList,
  FormInput,
} from "../../Components/form-component/FormComponent";
import NoDataFound from "../../Components/shared/fallbacks/no-data-found/NoDataFound";
import GroupsHandleSkeletons from "../../Components/shared/skeletons/GroupsHandleSkeletons";
import { addGroup, editGroup, getGroupById } from "../../core/apis/groupsAPI";
import { displayTypes, groupTypes } from "../../core/vairables/EnumData";

const schema = yup.object().shape({
  name: yup
    .string()
    .label("Name")
    .max(30)
    .required()
    .nullable()
    .test(
      "not-only-spaces",
      "Name cannot be only spaces",
      (value) => value == null || value.trim().length > 0
    ),
  type: yup.object().label("Type").required().nullable(),
  group_category: yup.object().label("Group type").required().nullable(),

  tags: yup.array().when("type", {
    is: (value) => value?.enum == "flat",
    then: (schema) =>
      schema.of(
        yup.object().shape({
          tag_id: yup.string().nullable(),
          name: yup
            .string()
            .label("Name")
            .max(30)
            .nullable()
            .test(
              "not-only-spaces",
              "Name cannot be only spaces",
              (value) => value == null || value.trim().length > 0
            )
            .test(
              "conditional-required",
              "Fill group name field",
              function (value) {
                const { path, createError } = this;
                const formValues = this.options.context || {};

                if (!formValues.name || formValues.name.trim() === "") {
                  if (!value || value.trim() === "") {
                    return createError({
                      path,
                      message: "Fill group name field",
                    });
                  }
                }

                return true;
              }
            ),
          icon: yup.mixed().nullable(),
        })
      ),
    otherwise: (schema) =>
      schema.of(
        yup.object().shape({
          tag_id: yup.string().nullable(),
          name: yup.string().label("Name").max(30).nullable().required(),
          icon: yup.mixed().nullable(),
        })
      ),
  }),
});

const GroupsHandle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [deletedTags] = useState([]);
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
      group_category: null,
      type: null,
      tags: [{ name: "", icon: null, tag_id: null }],
    },
    resolver: yupResolver(schema),
    mode: "all",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tags",
  });

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getGroupById(id)
        .then((res) => {
          if (!res?.error) {
            setError(false);
            reset({
              name: res?.data?.name || "",
              type:
                displayTypes?.find((el) => el?.id === res?.data?.type) || null,
              group_category:
                groupTypes?.find(
                  (el) => el?.id === res?.data?.group_category
                ) || null,
              tags:
                res?.data?.tag?.length !== 0
                  ? res?.data?.tag?.map((el) => {
                      return { ...el, tag_id: el?.id };
                    })
                  : [{ name: "", icon: null, tag_id: null }],
            });
          } else {
            setError(true);
            toast.error(res?.error);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const handleSubmitForm = (payload) => {
    setIsSubmitting(true);
    let handleAPI = id ? editGroup : addGroup;

    handleAPI({
      group: {
        name: payload?.name.trimEnd(),
        type: payload?.type?.id,
        group_category: payload?.group_category?.id,
      },
      tag: payload?.tags?.map(({ tag_id, ...rest }) => ({
        ...rest,
        name: rest?.name.trimEnd(),
        id: tag_id,
      })),
      deletedTags: deletedTags?.map(({ tag_id, ...rest }) => ({
        ...rest,
        id: tag_id,
      })),
      ...(id && { id: id }),
    })
      .then((res) => {
        if (!res?.error) {
          toast.success(`Group ${id ? "edited" : "added"} successfully`);
          navigate(-1);
        } else {
          toast.error(res?.error || "An error occured");
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleUpdateTag = (value) => {
    if (value?.enum == "flat") {
      remove();
      append({ name: getValues("name"), icon: null });
    }
  };

  const debouncedName = useDebouncedCallback(
    (value) => {
      if (watch("type")?.enum == "flat")
        setValue("tags.0.name", value, { shouldValidate: true });
    },

    200
  );

  const debouncedTagName = useDebouncedCallback(
    (value, index) => {
      setValue(`tags.${index}.name`, value, { shouldValidate: true });
    },

    200
  );

  if (id && loading) {
    return <GroupsHandleSkeletons />;
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
                />
              )}
              name="name"
              control={control}
            />
          </div>
          <div className={"flex-1 min-w-[200px]"}>
            <label htmlFor="type-input">Type*</label>

            <Controller
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormDropdownList
                  id="type-input"
                  accessName={"title"}
                  data={displayTypes}
                  value={value}
                  onChange={(value) => {
                    onChange(value);
                    handleUpdateTag(value);
                  }}
                  helperText={error?.message}
                  placeholder={"Select Display Type"}
                />
              )}
              name="type"
              control={control}
            />
          </div>
          <div className={"flex-1 min-w-[200px]"}>
            <label htmlFor="group-input">Group Type*</label>
            <Controller
              id="group-input"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormDropdownList
                  accessName={"title"}
                  data={groupTypes}
                  value={value}
                  onChange={onChange}
                  placeholder={"Select Type"}
                  helperText={error?.message}
                />
              )}
              name="group_category"
              control={control}
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[20px] h-px bg-gray-300" />
          <h6 className="px-2">Tags</h6>
          <div className="w-[20px] h-px bg-gray-300" />
        </div>
        {fields?.map(
          (
            el,
            index // NOSONAR
          ) => (
            <div className="flex flex-col gap-2 w-full sm:w-[70%]" key={index}>
              <div
                className={clsx(
                  "flex flex-row gap-2 justify-between items-end",
                  {
                    "!items-center": errors?.tags?.length > 0,
                  }
                )}
                key={`tags-${el?.id}-${el?.index}`}
              >
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="w-full sm:w-1/2 min-w-0">
                    <label className={"flex flex-row items-center"}>
                      Name*{" "}
                      {getValues("type")?.enum == "flat" && (
                        <Tooltip
                          title={`When the group type is 'flat', a tag is automatically created with the same name as the group.`}
                        >
                          <span className={"cursor-pointer"}>
                            <Info fontSize="small" />
                          </span>
                        </Tooltip>
                      )}
                    </label>
                    <Controller
                      render={({
                        field: { onChange, value },
                        fieldState: { error },
                      }) => (
                        <FormInput
                          placeholder="Enter Name"
                          value={value}
                          disabled={getValues("type")?.enum == "flat"}
                          onChange={(value) => {
                            onChange(value);
                            debouncedTagName(value, index);
                          }}
                          helperText={error?.message}
                        />
                      )}
                      name={`tags.${[index]}.name`}
                      control={control}
                    />
                  </div>
                  <div className="w-full sm:w-1/2 min-w-0">
                    <label htmlFor="icon-input">Icon</label>
                    <Controller
                      id="icon-input"
                      render={({ field: { onChange, value } }) => (
                        <FormAvatarEditor
                          value={value}
                          name={getValues(`tags.${[index]}.name`)}
                          onChange={(value) => onChange(value)}
                        />
                      )}
                      name={`tags.${[index]}.icon`}
                      control={control}
                    />
                  </div>
                </div>
                <div className="flex flex-row gap-2 w-[72px] justify-start">
                  {index === fields?.length - 1 &&
                  watch("type")?.enum !== "flat" ? (
                    <>
                      {fields?.length !== 1 && (
                        <IconButton
                          color="primary"
                          onClick={() => {
                            if (el?.id) {
                              deletedTags.push(el);
                            }
                            remove(index);
                          }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        color="primary"
                        onClick={() => append({ name: "", icon: null })}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      {fields?.length !== 1 && (
                        <IconButton
                          color="primary"
                          onClick={() => {
                            remove(index);
                            if (el?.id) {
                              deletedTags.push(el);
                            }
                          }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </form>
    </Card>
  );
};

export default GroupsHandle;
