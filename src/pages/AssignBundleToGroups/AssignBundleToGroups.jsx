import SaveIcon from "@mui/icons-material/Save";
import {
  Button,
  Card,
  CardContent,
  FormControl,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useTheme } from "@mui/styles";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
import NoDataFound from "../../Components/shared/fallbacks/no-data-found/NoDataFound";
import {
  assignTagsToBundle,
  getBundleTagsAndGroups,
} from "../../core/apis/bundlesAPI";
import { getAllGroups } from "../../core/apis/groupsAPI";
import GroupSection from "./components/GroupSection";
import { AssignBundleContext } from "./hooks/AssignBundleContext";
import AssignBundleToGroupsSkeleton from "./loaders/AssignBundleToGroupsSkeleton";

export default function AssignBundleToGroups() {
  const theme = useTheme();
  const navigate = useNavigate();
  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};

  const { bundleId } = useParams();

  if (!bundleId) {
    navigate(-1);
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroupes, setSelectedGroupes] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [bundleName, setBundleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupTagMap, setGroupTagMap] = useState({});
  const [errors, setErrors] = useState({});
  const [dataError, setDataError] = useState(false);
  const isTagSelectionEmpty = selectedTags?.length == 0;

  const addToGroupTagMapping = (groupId, tags) => {
    try {
      if (!groupId) {
        throw new Error("group id is required");
      }

      if (!tags) {
        setGroupTagMap((prev) => {
          if (!prev[groupId]) {
            return { ...prev, [groupId]: [] };
          }
          return prev;
        });
        return;
      }

      setGroupTagMap((prev) => ({
        ...prev,
        [groupId]: tags,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const removeFromGroupTagMapping = (groupId) => {
    try {
      if (!groupId) {
        throw new Error("group id is required");
      }

      const groupTags = groupTagMap[groupId]?.map((t) => t.id) || [];

      // Fix: Compare IDs directly
      const clearedSelectedTags = selectedTags.filter(
        (tagId) => !groupTags.includes(tagId)
      );

      setSelectedTags(clearedSelectedTags);

      setGroupTagMap((prev) => {
        const updatedMap = { ...prev };
        delete updatedMap[groupId];
        return updatedMap;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const removeGroup = (group) => {
    const newGroups = selectedGroupes?.filter((g) => g?.id != group?.id);
    setSelectedGroupes(newGroups);
    removeFromGroupTagMapping(group?.id);
  };

  const loadGroupOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;
    const res = await getAllGroups(page, pageSize, search, true);
    if (!res?.error) {
      removeErrorKey("loadGroupOptions");
      return {
        options: res?.data?.map((item) => ({
          ...item,
          value: item.id,
          label: item.name,
        })),
        hasMore: res?.data?.length === pageSize,
        additional: {
          page: page + 1,
        },
      };
    } else {
      setErrors((prev) => ({ ...prev, loadGroupOptions: res?.error }));
      return {
        options: [...loadedOptions],
        hasMore: false,
        additional: {
          page: page,
        },
      };
    }
  };

  const onChangeGroups = (value) => {
    const newIds = value?.map((g) => g.value) || [];

    // Find all removed groups
    const removedGroups =
      selectedGroupes?.filter((g) => !newIds.includes(g.value)) || [];

    removedGroups.forEach((group) => {
      removeFromGroupTagMapping(group?.id);
    });

    setSelectedGroupes(value || []);
  };

  const selectTag = (id) => {
    if (selectedTags.includes(id)) return;
    setSelectedTags((prev) => [...prev, id]);
  };

  const isTagSelected = (id) => {
    return selectedTags.includes(id);
  };

  const removeTag = (id) => {
    setSelectedTags((prev) => prev.filter((tagId) => tagId !== id));
  };

  const removeErrorKey = (keyToRemove) => {
    setErrors((prev) => {
      if (Object.hasOwn(prev, keyToRemove)) {
        const { [keyToRemove]: __unused, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  };

  const fetchTags = () => {
    setLoading(true);
    getBundleTagsAndGroups(bundleId)
      .then((res) => {
        if (!res?.error) {
          setBundleName(res?.bundleName);
          const tagsFromResponse = res?.data?.map((item) => item.tag?.id) ?? [];
          setSelectedTags(tagsFromResponse);

          const alreadySelectedGroups = Array.from(
            new Map(
              res?.data?.map((tbr) => [
                tbr?.tag?.tag_group?.id,
                {
                  ...tbr?.tag?.tag_group,
                  value: tbr?.tag?.tag_group?.id,
                  label: tbr?.tag?.tag_group?.name,
                },
              ])
            ).values()
          );
          setSelectedGroupes(alreadySelectedGroups);
          removeErrorKey("fetchTags");
          setDataError(false);
        } else {
          setDataError(true);
          toast.error(res?.error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const assignTags = async () => {
    if (isTagSelectionEmpty) {
      toast.error("Please assign at least one tag to the bundle.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await assignTagsToBundle(bundleId, selectedTags);
      if (error) throw error;
      toast.success("Tag Assigned Successfully");
      navigate("/bundles");
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignBundleContextValue = useMemo(
    () => ({
      selectedTags,
      setSelectedTags,
      removeGroup,
      removeTag,
      isTagSelected,
      selectTag,
      addToGroupTagMapping,
    }),
    [
      selectedTags,
      setSelectedTags,
      removeGroup,
      removeTag,
      isTagSelected,
      selectTag,
      addToGroupTagMapping,
    ]
  );

  useEffect(() => {
    if (bundleId) fetchTags();
  }, [bundleId]);

  if (loading) {
    return <AssignBundleToGroupsSkeleton />;
  }

  if (dataError) {
    return (
      <Card>
        <CardContent>
          {" "}
          <NoDataFound
            text={"Invalid ID or bundle data not loaded. Please try again"}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <AssignBundleContext.Provider value={assignBundleContextValue}>
      <Card className="page-card">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              {`Bundle : ${bundleName || "N/A"}`}
            </Typography>
          </Grid>
          <div className="w-full flex flex-col-reverse sm:flex-row justify-between gap-[1rem] sm:items-center">
            <div>
              <FormControl fullWidth>
                <label className="mb-2" htmlFor="group-select">
                  Groups
                </label>
                <AsyncPaginate
                  inputId="group-select"
                  isMulti
                  isClearable
                  value={selectedGroupes}
                  loadOptions={loadGroupOptions}
                  placeholder="Select Groups"
                  onChange={(value) => onChangeGroups(value)}
                  additional={{ page: 1 }}
                  isSearchable
                  debounceTimeout={300}
                  styles={asyncPaginateStyles}
                />
              </FormControl>
            </div>

            <div className={"flex justify-end items-center gap-[0.5rem]"}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/bundles")}
              >
                Cancel
              </Button>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                onClick={() => assignTags()}
                disabled={Object.keys(errors).length > 0 || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <Grid size={{ xs: 12 }}>
            {selectedGroupes?.length == 0 ? (
              <NoDataFound text={"No Groups Selected"} />
            ) : (
              <div className={"flex flex-col gap-[1rem]"}>
                {selectedGroupes?.map((group) => (
                  <GroupSection group={group} key={group?.id} />
                ))}
              </div>
            )}
          </Grid>
        </Grid>
      </Card>
    </AssignBundleContext.Provider>
  );
}
