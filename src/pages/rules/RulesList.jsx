import SearchIcon from "@mui/icons-material/Search";
import {
  Card,
  FormControl,
  Grid2,
  TableCell,
  TablePagination,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import RuleHandle from "../../Components/page-component/rules/RuleHandle";
import {
  deleteRule,
  getAllActions,
  getAllEvents,
  getAllRules,
} from "../../core/apis/rulesAPI";
import { beneficiaryData } from "../../core/vairables/EnumData";
import MuiModal from "../../Components/Modals/MuiModal";
import { FormDropdownList } from "../../Components/form-component/FormComponent";

function RulesList() {
  const [loading, setLoading] = useState(null);
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    pageSize: 10,
    page: 0,
    action: null,
    event: null,
  });

  const [search, setSearch] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openDelete, setOpenDelete] = useState({ data: null, open: false });
  const [actions, setActions] = useState([]);
  const [events, setEvents] = useState([]);
  const [addRule, setAddRule] = useState({ data: null, open: false });

  const getRules = () => {
    setLoading(true);

    try {
      const { name, page, pageSize, action, event } = searchQueries;

      getAllRules({
        page,
        pageSize,
        name,
        action: action?.id || null,
        event: event?.id || null,
      })
        .then((res) => {
          if (res?.error) {
            toast.error(res?.error);
            setLoading(false);
            setData([]);
            setTotalRows(0);
          } else {
            setTotalRows(res?.count || 0);
            setData(
              res?.data?.map((el) => ({
                ...el,
                ...el?.metadata,
              }))
            );
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (e) {
      toast.error(e?.message || "Fail to display data");
      setLoading(false);
    }
  };

  const handleDeleteRule = (id) => {
    deleteRule(id)
      .then((res) => {
        if (res?.status >= 200 && res?.status < 300) {
          toast.success("Rule deleted successfully");
          getRules();
        } else {
          toast.error(res?.error);
        }
      })
      .catch((error) => {
        toast.error(error?.message || "Failed to save rule");
      })
      .finally(() => {
        setOpenDelete({ data: null, open: false });
      });
  };
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
    getActionsData();
    getEventsData();
    getRules();
  }, [searchQueries]);

  const tableHeaders = [
    { name: "ID" },
    { name: "Action" },
    { name: "Event" },
    { name: "Max usage" },
    { name: "Beneficiary" },
  ];

  const resetFilters = () => {
    setSearchQueries({ ...searchQueries, name: "", event: null, action: null });
    setSearch("");
    setSelectedAction(null);
    setSelectedEvent(null);
  };

  const applyFilter = () => {
    setSearchQueries({
      ...searchQueries,
      name: search,
      action: selectedAction,
      event: selectedEvent,
    });
  };

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={
          (!search || search === "") &&
          selectedAction === null &&
          selectedEvent === null
        }
      >
        <Grid2 container size={{ xs: 12 }} spacing={2}>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-input">
                Search
              </label>
              <TextField
                id="search-input"
                fullWidth
                required
                size="small"
                placeholder="Search by ID"
                type="text"
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon />,
                    autoComplete: "new-password",
                    form: {
                      autoComplete: "off",
                    },
                  },
                }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />
            </FormControl>
          </Grid2>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-input">
                Action
              </label>
              <FormDropdownList
                placeholder={"Select Action"}
                value={selectedAction}
                data={actions || []}
                accessName={"name"}
                onChange={(value) => setSelectedAction(value)}
              />
            </FormControl>
          </Grid2>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-input">
                Event
              </label>
              <FormDropdownList
                placeholder={"Select Event"}
                value={selectedEvent}
                data={events || []}
                accessName={"name"}
                onChange={(value) => setSelectedEvent(value)}
              />
            </FormControl>
          </Grid2>
        </Grid2>
      </Filters>
      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        noDataFound={"No Rules Found"}
        tableHeaders={tableHeaders}
        actions={true}
        onAdd={() => setAddRule({ data: null, open: true })}
      >
        {data?.map((el) => (
          <RowComponent
            key={el?.id}
            actions={true}
            onEdit={() => {
              setAddRule({ data: el, open: true });
            }}
            onDelete={() => {
              setOpenDelete({ data: el?.id, open: true });
            }}
          >
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.id || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.promotion_rule_action?.name || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.promotion_rule_event?.name || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.max_usage || "N/A"}
            </TableCell>
            <TableCell>
              {beneficiaryData?.find((bf) => bf?.id == el?.beneficiary)
                ?.title || "N/A"}
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>
      <TablePagination
        component="div"
        count={totalRows || 0}
        page={searchQueries?.page}
        onPageChange={(e, newPage) => {
          setSearchQueries({ ...searchQueries, page: newPage });
        }}
        rowsPerPage={searchQueries?.pageSize}
        onRowsPerPageChange={(e) => {
          setSearchQueries({ ...searchQueries, pageSize: e.target.value });
        }}
      />

      {addRule?.open && (
        <RuleHandle
          data={addRule?.data}
          onClose={() => {
            setAddRule({ data: null, open: false });
          }}
          refetch={() => {
            getRules();
          }}
        />
      )}

      {openDelete?.open && (
        <MuiModal
          open={true}
          onClose={() => setOpenDelete({ data: null, open: false })}
          title={"Notice!"}
          onConfirm={() => handleDeleteRule(openDelete?.data)}
        >
          <p className={"text-center"}>
            Are you sure you want to delete this rule?
          </p>
        </MuiModal>
      )}
    </Card>
  );
}

export default RulesList;
