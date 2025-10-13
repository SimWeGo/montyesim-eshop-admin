import React, { useEffect, useMemo, useState } from "react";
import { Close } from "@mui/icons-material";
import { Dialog, DialogContent, IconButton, Skeleton } from "@mui/material";
import { getPromotionById } from "../../../core/apis/promotionsAPI";
import { toast } from "react-toastify";
import {
  beneficiaryData,
  DefaultCurrency,
} from "../../../core/vairables/EnumData";
import dayjs from "dayjs";
import TagComponent from "../../shared/tag-component/TagComponent";

const PromotionDetail = ({ id, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const getPromotionData = () => {
    setLoading(true);
    getPromotionById(id)
      .then((res) => {
        if (!res?.error) {
          setData(res?.data);
        } else {
          toast.error(res?.error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const valueType = useMemo(() => {
    let rule = data?.promotion_rule?.promotion_rule_action?.name?.toLowerCase();
    if (!rule) return "N/A";
    return rule?.includes("amount") ? DefaultCurrency : "%";
  }, [data]);

  useEffect(() => {
    getPromotionData();
  }, [id]);
  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogContent className="flex flex-col gap-[1rem] xs:!px-8 !py-10 justify-start">
        <div className={"flex flex-row justify-end"}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={() =>
              localStorage.getItem("i18nextLng") === "ar"
                ? {
                    position: "absolute",
                    left: 8,
                    top: 8,
                    color: "black",
                  }
                : {
                    position: "absolute",
                    right: 8,
                    top: 8,
                    color: "black",
                  }
            }
          >
            <Close />
          </IconButton>
        </div>
        <h1 className={"text-start"}>{"Promo Code Detail"}</h1>
        {loading ? (
          Array(5)
            .fill()
            .map((index) => <Skeleton key={index} />)
        ) : (
          <div className={"flex flex-col gap-1"}>
            <div>
              <label>Name</label>
              <p>{data?.name}</p>
            </div>
            <div>
              <label>Code</label>
              <p>{data?.code}</p>
            </div>
            <div>
              <label>Rule</label>
              <p>
                {data?.promotion_rule?.promotion_rule_action?.name} |{" "}
                {data?.promotion_rule?.promotion_rule_event?.name} |{" "}
                {data?.promotion_rule?.max_usage} |{" "}
                {
                  beneficiaryData?.find(
                    (el) => el?.id === data?.promotion_rule?.beneficiary
                  )?.title
                }
              </p>
            </div>
            <div>
              <label>Amount</label>
              <p>
                {data?.amount} {valueType}
              </p>
            </div>
            <div>
              <label>Times Used</label>
              <p>{data?.times_used}</p>
            </div>
            <div>
              <label>Duration</label>
              <p>
                From {dayjs(data?.valid_from).format("DD-MM-YYYY")} To{" "}
                {dayjs(data?.valid_to).format("DD-MM-YYYY")}
              </p>
            </div>
            <div>
              <label>Bundle Codes</label>
              <div
                className={"flex flex-col gap-1 max-h-[200px] overflow-auto"}
              >
                {!data?.bundle_code
                  ? "All"
                  : data?.bundle_code
                      ?.split(",")
                      ?.map((el) => <div key={el}>{el}</div>)}
              </div>
            </div>
            <div>
              <label>Status</label>
              <div>
                {" "}
                <TagComponent value={data?.is_active ? "Active" : "Inactive"} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDetail;
