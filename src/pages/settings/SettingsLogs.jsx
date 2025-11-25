import React, { useEffect, useState } from "react";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import {
  Accordion,
  Card,
  IconButton,
  TableCell,
  TablePagination,
} from "@mui/material";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { getAllSettingsLogs } from "../../core/apis/settingsAPI";
import { toast } from "react-toastify";
import SettingsLogsDetail from "./SettingsLogsDetail";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const SettingsLogs = () => {
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [expand, setExpand] = useState(null);
  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
  });

  const tableHeaders = [{ name: "User" }, { name: "Updated At" }];

  const getLogs = async () => {
    setLoading(true);

    try {
      const { page, pageSize, user } = searchQueries;
      getAllSettingsLogs({
        page,
        pageSize,
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
      console.error("Failed to load devices:", e);
      toast.error("Failed to load devices");

      setLoading(false);
    }
  };

  useEffect(() => {
    getLogs();
  }, []);
  return (
    <Card className="page-card">
      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data || []}
        noDataFound={"No logs found"}
        tableHeaders={tableHeaders}
        actions={true}
      >
        {data?.map((el) => (
          <RowComponent
            openCollapse={expand == el?.id}
            key={el?.id}
            actions={false}
            colSpan={3}
            row={el}
            collapseComponent={<SettingsLogsDetail data={el} />}
          >
            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.changed_by || "N/A"}
            </TableCell>

            <TableCell
              sx={{ minWidth: "200px" }}
              className={"max-w-[250px] truncate"}
            >
              {el?.changed_at
                ? dayjs(el?.changed_at).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>
            <TableCell>
              <IconButton
                onClick={() => {
                  setExpand(expand == el?.id ? null : el?.id);
                }}
              >
                <KeyboardArrowDownIcon />
              </IconButton>
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
};

export default SettingsLogs;
