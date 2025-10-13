import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { TableCell, TablePagination } from "@mui/material";
import { toast } from "react-toastify";

import RowComponent from "../../../Components/shared/table-component/RowComponent";
import TableComponent from "../../../Components/shared/table-component/TableComponent";
import { getAllReferralTransactions } from "../../../core/apis/usersAPI";
import CountUp from "react-countup";

export default function ReferralTransactionsTab() {
  const { id } = useParams();

  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
  });

  const tableHeaders = [
    { name: "Refer Code" },
    { name: "Reward Amount" },
    { name: "From User Email" },
    { name: "To User Email" },
    { name: "Order Number" },
    { name: "Referral Date" },
    { name: "Purchased Date" },
  ];

  const getReferralTransactions = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = searchQueries;

      const res = await getAllReferralTransactions(page, pageSize, id);
      if (res?.error) {
        throw res.error;
      }

      const rows = res?.data || [];

      setData(rows);
      setTotalRows(res?.count ?? 0);
    } catch (e) {
      console.error("Failed to load referral transactions:", e);
      toast.error(e?.message || "Failed to load referral transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReferralTransactions();
  }, [searchQueries, id]);

  return (
    <>
      <TableComponent
        loading={loading}
        dataPerPage={searchQueries.pageSize}
        tableData={data}
        noDataFound={"No Referral Transactions Found"}
        tableHeaders={tableHeaders}
        actions={false}
      >
        {data?.map((el, idx) => (
          <RowComponent key={el?.id || idx} actions={false}>
            <TableCell
              sx={{ minWidth: 140 }}
              className="max-w-[220px] truncate"
            >
              {el?.referral_code || "N/A"}
            </TableCell>
            <TableCell sx={{ minWidth: 140 }}>
              {el?.currency}{" "}
              <CountUp
                start={0}
                end={el?.amount}
                duration={1.5}
                separator=","
                decimals={2}
              />
            </TableCell>

            <TableCell
              sx={{ minWidth: 220 }}
              className="max-w-[260px] truncate"
            >
              {el?.from_user_email || "N/A"}
            </TableCell>

            <TableCell
              sx={{ minWidth: 220 }}
              className="max-w-[260px] truncate"
            >
              {el?.to_user_email || "N/A"}
            </TableCell>
            <TableCell
              sx={{ minWidth: 160 }}
              className="max-w-[220px] truncate"
            >
              {el?.id || el?.transaction_id || "N/A"}
            </TableCell>
            <TableCell sx={{ minWidth: 180 }}>
              {el?.created_at
                ? dayjs(el?.created_at).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>
            <TableCell sx={{ minWidth: 180 }}>
              {el?.payment_time
                ? dayjs(el.payment_time).format("DD-MM-YYYY HH:mm")
                : "N/A"}
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>

      <TablePagination
        component="div"
        count={totalRows || 0}
        page={searchQueries.page}
        onPageChange={(_, newPage) => {
          setSearchQueries({ ...searchQueries, page: newPage });
        }}
        rowsPerPage={searchQueries.pageSize}
        onRowsPerPageChange={(e) => {
          setSearchQueries({
            ...searchQueries,
            pageSize: Number(e.target.value),
            page: 0,
          });
        }}
      />
    </>
  );
}
