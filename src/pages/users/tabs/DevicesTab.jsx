//UTILITIES
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
//component
import { Card, TableCell, TablePagination } from "@mui/material";
import { toast } from "react-toastify";
import RowComponent from "../../../Components/shared/table-component/RowComponent";
import TableComponent from "../../../Components/shared/table-component/TableComponent";
import { getAllUserDevices } from "../../../core/apis/devicesAPI";

export default function DevicesTab() {
  const { id } = useParams();

  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(null);
  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
  });

  const getUserDevices = () => {
    setLoading(true);

    try {
      const { page, pageSize } = searchQueries;
      getAllUserDevices({
        page,
        pageSize,
        id,
      })
        .then((res) => {
          if (res?.error) {
            toast.error(res?.error);
            setTotalRows(0);
            setData([]);
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
      toast.error("Failed to load user devices");
      setLoading(false);
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

  useEffect(() => {
    getUserDevices();
  }, [searchQueries]);
  return (
    <>
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
            <TableCell>{el?.ip_location || "N/A"}</TableCell>
            <TableCell>
              {el?.timestamp_login
                ? dayjs(el?.timestamp_login).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>
            <TableCell>
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
    </>
  );
}
