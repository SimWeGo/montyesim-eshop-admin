//UTILITIES
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import { toast } from "react-toastify";
//COMPONENT
import {
  Card,
  FormControl,
  TableCell,
  TablePagination,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Filters from "../../Components/Filters/Filters";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import { getAllDevices } from "../../core/apis/devicesAPI";
import { getAllUsersDropdown } from "../../core/apis/usersAPI";

function DevicesPage() {
  const theme = useTheme();

  const asyncPaginateStyles = theme?.asyncPaginateStyles || {};
  const loadedOptions = [];
  const [loading, setLoading] = useState(null);
  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
    user: null,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);

  const getDevices = async () => {
    setLoading(true);

    try {
      const { page, pageSize, user } = searchQueries;
      getAllDevices({
        page,
        pageSize,
        user,
      })
        .then((res) => {
          if (res?.error) {
            toast.error(res?.error);
            setData([]);
            setTotalRows(0);
          } else {
            setTotalRows(res?.count || 0);
            setData(
              res?.data?.map((el) => ({
                ...el,
              }))
            );
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (e) {
      toast.error("Failed to load devices");

      setLoading(false);
    }
  };

  useEffect(() => {
    getDevices();
  }, [searchQueries]);

  const resetFilters = () => {
    setSearchQueries({
      pageSize: 10,
      page: 0,
      user: null,
    });
    setSelectedUser(null);
  };

  const applyFilter = () => {
    setSearchQueries({ ...searchQueries, user: selectedUser?.id });
  };

  const loadOptions = async (search, loadedOptions, { page }) => {
    const pageSize = 10;
    const res = await getAllUsersDropdown({ page, pageSize, name: search });
    if (!res?.error) {
      return {
        options: res?.data?.map((item) => ({
          ...item,
          value: item.id,
          label: item.email || item?.metadata?.email,
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

  const tableHeaders = [
    { name: "Deviced ID" },
    { name: "Manufacturer" },
    { name: "Device Model" },
    { name: "IP Location" },
    { name: "LoggedIn At" },
    { name: "LoggedOut At" },
  ];

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={!selectedUser}
      >
        <Grid container size={{ xs: 12 }} spacing={2}>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="user-input">
                User
              </label>
              <AsyncPaginate
                id="user-input"
                isClearable={true}
                value={selectedUser}
                loadOptions={loadOptions}
                placeholder={"Select User Email"}
                onChange={(value) => {
                  if (!value) {
                    resetFilters();
                  } else {
                    setSelectedUser(value);
                  }
                }}
                additional={{ page: 1 }}
                options={loadedOptions}
                isSearchable
                debounceTimeout={300}
                styles={{
                  ...asyncPaginateStyles,
                }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </Filters>
      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        noDataFound={"No Devices Found"}
        tableHeaders={tableHeaders}
        actions={true}
      >
        {data?.map((el) => (
          <RowComponent key={el?.id} actions={true}>
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
              {el?.manufacturer || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.device_model || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.ip_location || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.timestamp_login
                ? dayjs(el?.timestamp_login).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.timestamp_logout
                ? dayjs(el?.timestamp_logout).format("DD-MM-YYYY HH:mm")
                : "N/A"}
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
    </Card>
  );
}

export default DevicesPage;
