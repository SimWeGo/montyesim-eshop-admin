import { Card, CardContent } from "@mui/material";
import clsx from "clsx";
import React from "react";

const SettingsLogsDetail = ({ data }) => {
  const oldData = JSON.parse(data?.old_data);
  const newData = JSON.parse(data?.new_data);
  const oldObj = Object.fromEntries(oldData.map((i) => [i.key, i.value]));
  const newObj = Object.fromEntries(newData.map((i) => [i.key, i.value]));

  return (
    <div className={"grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4"}>
      <Card>
        <CardContent className={"flex flex-col gap-2"}>
          <h3>Old - {oldData?.length} items</h3>
          {oldData?.map((old_row) => {
            const changed =
              oldObj[old_row.key] !== newObj[old_row.key] ||
              !Object.prototype.hasOwnProperty.call(newObj, old_row.key);
            return (
              <div
                className={clsx("grid grid-cols-1 sm:grid-cols-2 sm:gap-4", {
                  "px-2 rounded bg-red-500": changed,
                })}
                key={old_row?.key}
              >
                <label className={"break-all"}>{old_row?.key}</label>
                <p className={"break-all"}>{old_row?.value}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardContent className={"flex flex-col gap-2"}>
          <h3>New - {newData?.length} items</h3>
          {newData?.map((new_row) => {
            const changed =
              oldObj[new_row.key] !== newObj[new_row.key] ||
              !Object.prototype.hasOwnProperty.call(oldObj, new_row.key);
            return (
              <div
                className={clsx("grid grid-cols-1 sm:grid-cols-2 sm:gap-4", {
                  "px-2 rounded bg-green-400": changed,
                })}
                key={new_row?.key}
              >
                <label className={"break-all"}>{new_row?.key}</label>
                <p className={"break-all"}>{new_row?.value}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsLogsDetail;
