//UTILITIES
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
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
import TagComponent from "../../Components/shared/tag-component/TagComponent";
import { getAllOrders } from "../../core/apis/ordersAPI";
import { getAllUsersDropdown } from "../../core/apis/usersAPI";
import { getAllSettings } from "../../core/apis/settingsAPI";
import { useNavigate } from "react-router-dom";
import PageNotFound from "../../Components/shared/fallbacks/page-not-found/PageNotFound";
import { useSelector } from "react-redux";

function Settings() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.authentication);
  const [loading, setLoading] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
  });

  const getOrders = async () => {
    setLoading(true);

    try {
      getAllSettings()
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
      toast.error("Failed to load settings");

      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, [searchQueries]);

  const tableHeaders = [
    { name: "Key" },
    { name: "Value" },
    { name: "Created At" },
  ];

  return (
    <Card className="page-card">
      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        noDataFound={"No Setting Params Found"}
        tableHeaders={tableHeaders}
        actions={true}
        onEdit={() => navigate("/settings/edit")}
      >
        {data?.map((el) => (
          <RowComponent key={el?.id} actions={true}>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.key || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.value || "N/A"}
            </TableCell>

            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.created_at
                ? dayjs(el?.created_at).format("DD-MM-YYYY HH:mm")
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

export default Settings;
