import {
  Card,
  FormControl,
  IconButton,
  TableCell,
  TablePagination,
  TextField,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import React, { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import Loader from "../../Components/Loader/Loader";
import MuiTable from "../../Components/Tables/MuiTable/MuiTable";
import supabase from "../../core/apis/supabase";
import { Check, Close, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Filters from "../../Components/Filters/Filters";
import { toast } from "react-toastify";
import { getAllUsers } from "../../core/apis/usersAPI";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";

function UsersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    pageSize: 10,
    page: 0,
  });

  const [search, setSearch] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);

  const getUsers = () => {
    setLoading(true);

    try {
      const { name, page, pageSize } = searchQueries;
      getAllUsers({
        page,
        pageSize,
        name,
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

  useEffect(() => {
    getUsers();
  }, [searchQueries]);

  const resetFilters = () => {
    setSearchQueries({ name: "", pageSize: 10, page: 0 });
    setSearch("");
  };

  const applyFilter = () => {
    setSearchQueries({ ...searchQueries, name: search });
  };

  const tableHeaders = [
    { name: "Name" },
    { name: "Email" },
    { name: "MSISDN" },
    { name: "Email Verified" },
    { name: "Phone Verified" },
    { name: "Should Notify" },
  ];

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={!search || search === ""}
      >
        <Grid container size={{ xs: 12 }} spacing={2}>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2">Search</label>
              <TextField
                fullWidth
                required
                size="small"
                placeholder="Search By Email"
                type="text"
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1 }} />,
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
          </Grid>
        </Grid>
      </Filters>

      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        noDataFound={"No Users Found"}
        tableHeaders={tableHeaders}
        actions={true}
      >
        {data?.map((el) => (
          <RowComponent
            key={el?.id}
            actions={true}
            onView={() => navigate(`/users/${el?.id}`)}
          >
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.name || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.email || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.msisdn || "N/A"}
            </TableCell>
            <TableCell>
              {el?.email_verified ? (
                <Check color="success" />
              ) : (
                <Close color="error" />
              )}
            </TableCell>
            <TableCell>
              {el?.phone_verified ? (
                <Check color="success" />
              ) : (
                <Close color="error" />
              )}
            </TableCell>
            <TableCell>
              {el?.should_notify ? (
                <Check color="success" />
              ) : (
                <Close color="error" />
              )}
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>
      <TablePagination
        component="div"
        count={totalRows || 0}
        page={searchQueries?.page}
        onPageChange={(e, newPage) => {
          console.log(newPage, "dddddddddddd");
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

export default UsersPage;
