import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { exportReferralsData } from "../../../core/apis/referralsAPI";

export const exportReferralExcel = async (
  user,
  search,
  from_user,
  referral_date
) => {
  try {
    const { referrals } = await exportReferralsData(
      user,
      search,
      from_user,
      referral_date
    );

    const referralData = (referrals || []).map((r) => ({
      "Refer Code": r.referral_code,
      "Reward Amount":
        r.amount != null ? `${r.currency || ""} ${r.amount}` : null,
      "Modified Amount":
        r.modified_amount != null
          ? `${r.currency || ""} ${r.modified_amount}`
          : null,
      "From Email": r.referred_to,
      "To Email": r.user_email,
      "Order Number": r.id,
      "Order Status": r.order_status,
      "Referral Date": r.created_at,
      "Purchased Date": r.payment_time,
      "Promo Status": r.status,
    }));

    const wb = XLSX.utils.book_new();

    if (referralData.length > 0) {
      const sheet = XLSX.utils.json_to_sheet(referralData);
      XLSX.utils.book_append_sheet(wb, sheet, "Referral Transactions");
    }

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `referrals_export.xlsx`);
  } catch (error) {
    toast.error(error?.message || "Failed to export Excel");
  }
};
