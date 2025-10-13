import React from "react";
import MuiModal from "../../../../Components/Modals/MuiModal";
import VoucherForm from "../forms/VoucherForm";

export default function VoucherFormModal({
  open,
  onClose,
  onSuccess,
  voucher,
}) {
  return (
    <div>
      <MuiModal
        open={open}
        title={voucher ? "Edit Voucher" : "Add Voucher"}
        displayButtons={false}
        size="md"
      >
        <VoucherForm
          voucher={voucher}
          onSuccess={onSuccess}
          OnCancel={onClose}
        />
      </MuiModal>
    </div>
  );
}
