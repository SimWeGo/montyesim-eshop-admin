export const displayTypes = [
  { title: "Group", id: 1, enum: "group" },
  { title: "Flat", id: 2, enum: "flat" },
];

export const groupTypes = [
  { title: "At Sea", id: "at_sea" },
  { title: "On Land", id: "on_land" },
];

export const beneficiaryData = [
  { title: "Sender", id: 1 },
  { title: "Sender & Receiver", id: 2 },
];

export const DefaultCurrency = import.meta.env.VITE_CURRENCY_DEFAULT || "USD";
