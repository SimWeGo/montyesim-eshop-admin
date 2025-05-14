import { Close } from "@mui/icons-material";
import { Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import React from "react";

const ContactUsDetail = ({ data, onClose }) => {
  return (
    <Dialog fullWidth open={true} maxWidth="sm">
      <DialogContent className="flex flex-col items-center justify-center gap-[2rem] text-center !py-10">
        <div className={"flex flex-row justify-end"}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={(theme) => ({
              position: "absolute",
              right: 8,
              top: 8,
              color: "black",
            })}
          >
            <Close />
          </IconButton>
        </div>
        <div className={"flex flex-col gap-2 w-[100%]"}>
          <Typography variant="h6" className="font-semibold">
            Contact Us Detail
          </Typography>

          <p className="text-content-600 font-medium text-justify">
            {data?.content || ""}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactUsDetail;
