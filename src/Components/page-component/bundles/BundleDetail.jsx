import { Close, QuestionMark } from "@mui/icons-material";
import {
  Avatar,
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import clsx from "clsx";
import TooltipComponent from "../../shared/tooltip-component/TooltipComponent";

const BundleDetail = ({ onClose, bundle }) => {
  const isSmall = useMediaQuery("(max-width: 639px)");

  return (
    <Dialog fullWidth open={true} maxWidth={"sm"}>
      <DialogContent className={"flex flex-col gap-2"}>
        <div className={"flex flex-row justify-end"}>
          <IconButton
            fontSize="small"
            aria-label="close"
            onClick={onClose}
            sx={(theme) => ({
              position: "absolute",
              right: 8,
              top: 2,
              color: "black",
            })}
          >
            <Close />
          </IconButton>
        </div>
        <div
          className={
            "flex flex-col sm:flex-row justify-between sm:items-start gap-[0.3rem]"
          }
        >
          <div className={"flex flex-row gap-4 items-center min-w-0 "}>
            <Avatar
              src={bundle?.icon}
              alt={bundle?.display_title || ""}
              sx={{ width: 45, height: 45 }}
            >
              {/* fallback image */}
              <img
                src={"/media/global.svg"}
                className={"bg-white"}
                alt={bundle?.display_title || ""}
              />
            </Avatar>
            <div
              className={"flex flex-col justify-between items-start min-w-0"}
            >
              <p
                className={
                  "text-xl font-bold text-(--color-primary) truncate w-full sm:max-w-none"
                }
              >
                {bundle?.display_title || ""}
              </p>
              {/* NOTES: done by request because title and sub title are same
              <p className={"text-base text-color-400 truncate w-full"}>
                {bundle?.display_subtitle || ""}
              </p>
               */}
            </div>
          </div>
          <div
            className={
              "text-2xl font-bold text-(--color-primary) flex justify-end break-all"
            }
          >
            {bundle?.validity_display || ""}
          </div>
        </div>
        <hr />
        <div
          className={
            "flex sm:flex-row justify-between  items-center text-2xl font-bold text-(--color-primary) min-w-0 gap-[0.5rem]"
          }
        >
          <TooltipComponent title={isSmall ? bundle?.gprs_limit_display : ""}>
            <p className={"truncate min-w-0"}>{bundle?.gprs_limit_display}</p>
          </TooltipComponent>
          <p className={"flex flex-row justify-end whitespace-nowrap"}>
            {bundle?.price_display}
          </p>
        </div>
        <div
          className={
            "flex flex-col sm:flex-row gap-[1rem] items-start sm:min-h-[150px]"
          }
        >
          <div
            className={clsx(
              "flex flex-col w-[100%]   gap-[1rem] bg-(--bg-light) rounded-md p-2",
              {
                "flex-1": bundle?.bundle_category?.type === "CRUISE",
              }
            )}
          >
            <h6>Additional Information</h6>

            <div
              className={
                "flex flex-col gap-[0.5rem] overflow-x-hidden overflow-x-auto cursor-auto"
              }
            >
              <div className={"flex flex-col gap-[0.1rem]"}>
                <div className={"text-content-600"}>Plan Type</div>
                <p className={"font-semibold break-words"}>
                  {bundle?.plan_type || "N/A"}
                </p>
              </div>
              <hr className={"bg-(--border-shade-600) h-[2px]"} />
              <div>
                <div className={"text-content-600"}>Activation Policy</div>
                <p className={"font-semibold break-words"}>
                  {bundle?.activity_policy || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            "bg-(--bg-light) flex flex-row gap-6 items-center p-2 rounded-md"
          }
        >
          <div className=" flex items-center justify-center basis-[10%]">
            <div
              className={
                "w-11 h-11 bg-[#d7e9f7] rounded-full flex items-center justify-center shadow-sm"
              }
            >
              <QuestionMark
                className="text-gray-700"
                fontSize="small"
                color={"info"}
              />
            </div>
          </div>
          <div className={"flex flex-col gap-1"}>
            <h6>Compatibility</h6>
            <p className={"text-sm font-bold break-words"}>
              Find out if your device can use eSIM by dialing *#06# and looking
              for the EID.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BundleDetail;
