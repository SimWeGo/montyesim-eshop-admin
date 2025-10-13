import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { TableCell, TablePagination } from "@mui/material";
import { toast } from "react-toastify";
import TagComponent from "../../../Components/shared/tag-component/TagComponent";
import RowComponent from "../../../Components/shared/table-component/RowComponent";
import TableComponent from "../../../Components/shared/table-component/TableComponent";
import { getAllWalletTransactions } from "../../../core/apis/usersAPI";
import { DefaultCurrency } from "../../../core/vairables/EnumData";
import CountUp from "react-countup";

export default function WalletTransactionsTab() {
  const { id } = useParams();

  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
  });

  const tableHeaders = [
    { name: "Source" },
    { name: "Amount" },
    { name: "Status" },
    { name: "Created At" },
  ];

  const getWalletTransactions = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = searchQueries;

      const res = await getAllWalletTransactions(page, pageSize, id);
      if (res?.error) throw res.error;

      const rows = res?.data || [];
      const mapped = rows.map((r) => ({
        id: r.id,
        status: r.status,
        source: r.source,
        amount: r.amount,
        created_at: r.created_at,
      }));

      setData(mapped);
      setTotalRows(res?.count ?? 0);
    } catch (e) {
      console.error("Failed to load wallet transactions:", e);
      toast.error(e?.message || "Failed to load wallet transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getWalletTransactions();
  }, [searchQueries, id]);

  return (
    <>
      <TableComponent
        loading={loading}
        dataPerPage={searchQueries.pageSize}
        tableData={data}
        noDataFound={"No Wallet Transactions Found"}
        tableHeaders={tableHeaders}
        actions={false}
      >
        {data?.map((el, idx) => (
          <RowComponent key={el?.id || idx} actions={false}>
            <TableCell
              sx={{ minWidth: 180 }}
              className="max-w-[240px] truncate"
            >
              {el?.source || "N/A"}
            </TableCell>

            <TableCell sx={{ minWidth: 140 }}>
              {DefaultCurrency}{" "}
              <CountUp
                start={0}
                end={el?.amount}
                duration={1.5}
                separator=","
                decimals={2}
              />
            </TableCell>
            <TableCell sx={{ minWidth: 120 }}>
              <TagComponent value={el?.status || "N/A"} />
            </TableCell>
            <TableCell sx={{ minWidth: 180 }}>
              {el?.created_at
                ? dayjs(el.created_at).format("DD-MM-YYYY HH:mm")
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
