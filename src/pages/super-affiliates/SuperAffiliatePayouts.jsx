import ReplayIcon from "@mui/icons-material/Replay";
import {
  Alert,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  TableCell,
  Tooltip,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FormInput } from "../../Components/form-component/FormComponent";
import ConfirmActionModal from "../../Components/Modals/ConfirmActionModal";
import MuiModal from "../../Components/Modals/MuiModal";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import {
  createSuperPayout,
  getPendingNetworks,
  getSuperPendingAmount,
  getSuperPayouts,
  undoSuperPayout,
} from "../../core/apis/superAffiliatesAPI";
import { useIsSuperAdmin } from "../../core/hoc/WithSuperAdminOnly";
import { formatCents, formatRate } from "../../core/helpers/formatCurrency";

// ⚠️ ADAPTATION vs annexe §B12 : le backend réel (admin_payouts.py, Sprint 3)
// expose GET /admin/payouts/pending (SuperWithPendingDTO), GET
// /admin/payouts/super-affiliates/{id}/pending (PendingAmountDTO — breakdown
// S/M), POST /admin/payouts/super-affiliates/{id} (200 SuperPayoutDTO | 204
// rien à payer) et POST /admin/payouts/super/{id}/undo ({payout_id,
// restored_entries}). Il n'existe PAS d'endpoint d'historique paginé → la
// section historique serveur de l'annexe est remplacée par la liste des
// payouts générés dans la session (undo possible dessus). TOUT le router
// est super_admin_only → la page ne fetch rien pour un admin simple.

// -------------------------------------------- Dialog de génération (2 étapes)
// Étape 1 : breakdown S/M (fetché via /pending du super — même prédicat que
// le claim du RPC) + références de paiement — étape 2 : récap final.
// Les champs sont optionnels (CreateSuperPayoutRequest) → pas de RHF.
const GeneratePayoutDialog = ({ network, onClose, onDone }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // PendingAmountDTO : breakdown sub_commissions_cents / super_margin_cents
  const [breakdown, setBreakdown] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(true);

  useEffect(() => {
    getSuperPendingAmount(network?.super_affiliate_id)
      .then((res) => {
        if (res?.error) {
          // Non bloquant : le total de la liste reste affichable
          toast.error(res?.error);
          setBreakdown(null);
        } else {
          setBreakdown(res?.data);
        }
      })
      .finally(() => setBreakdownLoading(false));
  }, []);

  // Montant de référence : le détail (frais, même prédicat que le claim)
  // sinon la ligne de la liste
  const totalCents =
    breakdown?.pending_amount_cents ?? network?.pending_amount_cents;
  const entryCount = breakdown?.entry_count ?? network?.entry_count;
  const currency = breakdown?.currency ?? network?.currency;
  const total = formatCents(totalCents, currency);
  const mixedCurrencies =
    (breakdown?.currency_count ?? network?.currency_count ?? 0) > 1;

  const handleCreate = () => {
    setSubmitting(true);
    createSuperPayout(network?.super_affiliate_id, {
      payment_method: method || null,
      payment_reference: reference || null,
      notes: notes || null,
    })
      .then((res) => {
        // 204 : concurrence bénigne (déjà réclamé entre l'affichage et le
        // clic) — pattern claim-then-record, rien n'a été créé
        if (!res?.error && res?.status === 204) {
          toast.info("Nothing left to pay for this network");
          onDone(null);
        } else if (res?.error) {
          // ex. PAYOUT_MIXED_CURRENCIES (409) → revue manuelle
          toast.error(
            res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
          );
        } else {
          toast.success(
            `Payout created — ${formatCents(
              res?.data?.total_amount_cents,
              res?.data?.currency
            )} marked as paid (${res?.data?.entry_count} entries)`
          );
          // Le nom du réseau ne voyage pas dans SuperPayoutDTO → gardé
          // localement pour la section "payouts de la session"
          onDone({ ...res?.data, super_name: network?.name });
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <MuiModal
      open={true}
      onClose={onClose}
      title={`Generate payout — ${network?.name}`}
      displayButtons={true}
      buttonChildren={
        step === 1 ? (
          <>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setStep(2)}
            >
              I understand, continue
            </Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={submitting}
              onClick={handleCreate}
            >
              {submitting ? "Submitting..." : `Mark ${total} as paid`}
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className={"flex flex-col gap-[1rem]"}>
          {breakdownLoading ? (
            <div className={"flex justify-center items-center h-[60px]"}>
              <CircularProgress size={24} color="primary" />
            </div>
          ) : (
            <Alert severity="warning">
              Claim-all: this will claim{" "}
              <span className={"font-bold"}>
                ALL {entryCount} unpaid entries
              </span>{" "}
              of this network for a total of{" "}
              <span className={"font-bold"}>{total}</span>
              {breakdown && (
                <>
                  {" "}
                  (sub commissions{" "}
                  {formatCents(breakdown?.sub_commissions_cents, currency)} +
                  super margin{" "}
                  {formatCents(breakdown?.super_margin_cents, currency)})
                </>
              )}
              . There is no period selection. A payout can only be reverted by
              a super admin (Undo).
            </Alert>
          )}
          {mixedCurrencies && (
            <Alert severity="error">
              Unclaimed entries mix several currencies — the API will refuse
              the payout (PAYOUT_MIXED_CURRENCIES). Manual review required.
            </Alert>
          )}
          {Number(totalCents) < 0 && (
            <Alert severity="error">
              The balance is negative (refund reversals exceed accruals) —
              double-check with finance before proceeding.
            </Alert>
          )}
          <div>
            <label>Payment method </label>
            <FormInput
              placeholder={"e.g. SEPA transfer, Wise, Mobile Money"}
              value={method}
              onChange={(value) => setMethod(value)}
            />
          </div>
          <div>
            <label>Payment reference </label>
            <FormInput
              placeholder={"Bank/PSP reference of the transfer"}
              value={reference}
              onChange={(value) => setReference(value)}
            />
          </div>
          <div>
            <label>Notes </label>
            <FormInput
              placeholder={"Internal notes"}
              value={notes}
              onChange={(value) => setNotes(value)}
            />
          </div>
        </div>
      ) : (
        <p className={"text-center"}>
          Mark <span className={"font-bold"}>{total}</span> ({entryCount}{" "}
          entries) as <span className={"font-bold"}>PAID</span> to{" "}
          <span className={"font-bold"}>{network?.name}</span> now?
        </p>
      )}
    </MuiModal>
  );
};

// ------------------------------------------------------------------- Page
const SuperAffiliatePayouts = () => {
  const isSuperAdmin = useIsSuperAdmin();

  // ---- Section pending (une ligne par réseau — SuperWithPendingDTO)
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pending, setPending] = useState([]);
  const [generate, setGenerate] = useState({ open: false, data: null });

  // ---- Historique SERVEUR des payouts (GET /admin/super-affiliates/payouts,
  // monty-api S5) — page 0, 25 lignes, réseaux confondus.
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [undo, setUndo] = useState({
    open: false,
    data: null,
    submitting: false,
  });

  const getPending = () => {
    setPendingLoading(true);
    getPendingNetworks()
      .then((res) => {
        if (res?.error) {
          toast.error(res?.error);
          setPending([]);
        } else {
          setPending(res?.data || []);
        }
      })
      .finally(() => setPendingLoading(false));
  };

  const getHistory = () => {
    setHistoryLoading(true);
    getSuperPayouts({ page: 0, pageSize: 25 })
      .then((res) => {
        if (res?.error) {
          toast.error(res?.error);
          setHistory([]);
        } else {
          setHistory(res?.data || []);
        }
      })
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    // TOUT /admin/payouts/* est super_admin_only : ne rien fetcher pour un
    // admin simple (la page resterait sinon une cascade de toasts 403)
    if (isSuperAdmin) {
      getPending();
      getHistory();
    }
  }, [isSuperAdmin]);

  const handleUndo = () => {
    setUndo((prev) => ({ ...prev, submitting: true }));
    undoSuperPayout(undo?.data?.id)
      .then((res) => {
        if (res?.error) {
          // PAYOUT_NOT_FOUND (404) / PAYOUT_ALREADY_UNDONE (409)
          toast.error(
            res?.errorCode ? `${res.error} [${res.errorCode}]` : res?.error
          );
          setUndo((prev) => ({ ...prev, submitting: false }));
        } else {
          toast.success(
            `Payout cancelled — ${res?.data?.restored_entries} ledger entries released back to unpaid`
          );
          setUndo({ open: false, data: null, submitting: false });
          // Source de vérité = serveur : refetch (la ligne passe cancelled)
          getPending();
          getHistory();
        }
      });
  };

  const pendingHeaders = [
    { name: "Network" },
    { name: "N" },
    { name: "Subs" },
    { name: "Entries" },
    { name: "Pending amount" },
    { name: "Oldest entry" },
    { name: "Status" },
    { name: "" },
  ];

  const sessionHeaders = [
    { name: "Date" },
    { name: "Network" },
    { name: "Total" },
    { name: "Sub / Margin" },
    { name: "Entries" },
    { name: "Status" },
    { name: "Method" },
    { name: "Reference" },
    { name: "" },
  ];

  // Barrière UX : le back refuserait de toute façon (403 super_admin_only)
  if (!isSuperAdmin) {
    return (
      <Card className="page-card">
        <Alert severity="info">
          Payout data is restricted to super admins (all /admin/payouts
          endpoints are super_admin only). Ask a super admin to generate or
          undo payouts.
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="page-card">
      {/* ================= Pending by network ================= */}
      <div className="flex items-center">
        <div className="w-[20px] h-px bg-gray-300" />
        <h6 className="px-2">Pending commissions by network</h6>
        <div className="w-[20px] h-px bg-gray-300" />
      </div>

      <TableComponent
        loading={pendingLoading}
        tableData={pending}
        tableHeaders={pendingHeaders}
        actions={false}
        noDataFound={"No network with unpaid commissions"}
      >
        {pending?.map((el) => (
          <RowComponent key={el?.super_affiliate_id} actions={false}>
            <TableCell className={"max-w-[200px] truncate"}>
              {el?.name || "N/A"}
            </TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {formatRate(el?.network_commission_rate)}
            </TableCell>
            <TableCell>{el?.sub_count ?? 0}</TableCell>
            <TableCell>{el?.entry_count ?? 0}</TableCell>
            <TableCell className={"whitespace-nowrap font-bold"}>
              {formatCents(el?.pending_amount_cents, el?.currency)}
              {Number(el?.pending_amount_cents) < 0 && (
                <Chip
                  size="small"
                  color="error"
                  label="Negative"
                  sx={{ ml: 1 }}
                />
              )}
              {/* currency_count > 1 ⇒ la génération échouera (garde devise) */}
              {Number(el?.currency_count) > 1 && (
                <Tooltip
                  title={
                    "Entries mix several currencies — payout generation will fail (manual review)"
                  }
                  placement={"top"}
                >
                  <Chip
                    size="small"
                    color="warning"
                    label="Mixed currencies"
                    sx={{ ml: 1 }}
                  />
                </Tooltip>
              )}
            </TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {el?.oldest_entry_at
                ? dayjs(el?.oldest_entry_at).format("DD-MM-YYYY")
                : "N/A"}
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                color={el?.is_active ? "success" : "default"}
                label={el?.is_active ? "Active" : "Inactive"}
              />
            </TableCell>
            <TableCell align={"right"}>
              <Button
                variant={"contained"}
                color="primary"
                size="small"
                onClick={() => setGenerate({ open: true, data: el })}
              >
                Generate payout
              </Button>
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>

      {/* ================= Payout history (server) ================= */}
      <div className="flex items-center mt-6">
        <div className="w-[20px] h-px bg-gray-300" />
        <h6 className="px-2">Payout history</h6>
        <div className="w-[20px] h-px bg-gray-300" />
      </div>
      <p className={"text-sm px-2"}>
        Last 25 payouts (all networks). Cancelled payouts stay listed for
        audit. Undo releases the claimed ledger entries back to unpaid.
      </p>

      <TableComponent
        loading={historyLoading}
        tableData={history}
        tableHeaders={sessionHeaders}
        actions={false}
        noDataFound={"No payout yet"}
      >
        {history?.map((el) => (
          <RowComponent
            key={el?.id}
            actions={false}
            className={el?.status === "cancelled" ? "opacity-50" : undefined}
          >
            <TableCell className={"whitespace-nowrap"}>
              {el?.paid_at || el?.created_at
                ? dayjs(el?.paid_at || el?.created_at).format(
                    "DD-MM-YYYY HH:mm"
                  )
                : "N/A"}
            </TableCell>
            <TableCell className={"max-w-[200px] truncate"}>
              {el?.super_name || el?.super_affiliate_id}
            </TableCell>
            <TableCell className={"whitespace-nowrap font-bold"}>
              {formatCents(el?.total_amount_cents, el?.currency)}
            </TableCell>
            <TableCell className={"whitespace-nowrap"}>
              {`${formatCents(
                el?.sub_commissions_amount_cents,
                el?.currency
              )} / ${formatCents(el?.super_margin_amount_cents, el?.currency)}`}
            </TableCell>
            <TableCell>{el?.entry_count ?? 0}</TableCell>
            <TableCell>
              <Chip
                size="small"
                color={el?.status === "paid" ? "success" : "default"}
                label={el?.status}
              />
            </TableCell>
            <TableCell className={"max-w-[150px] truncate"}>
              {el?.payment_method || "N/A"}
            </TableCell>
            <TableCell className={"max-w-[150px] truncate"}>
              {el?.payment_reference || "N/A"}
            </TableCell>
            <TableCell align={"right"}>
              {/* Undo = ARGENT → jamais sur un payout déjà annulé */}
              {el?.status === "paid" && !el?.undone_at && (
                <Tooltip title={"Undo payout"} placement={"top"}>
                  <IconButton
                    color="error"
                    aria-label="undo"
                    onClick={() =>
                      setUndo({ open: true, data: el, submitting: false })
                    }
                  >
                    <ReplayIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </TableCell>
          </RowComponent>
        ))}
      </TableComponent>

      {generate?.open && (
        <GeneratePayoutDialog
          network={generate?.data}
          onClose={() => setGenerate({ open: false, data: null })}
          onDone={(payout) => {
            setGenerate({ open: false, data: null });
            getPending();
            getHistory();
          }}
        />
      )}

      {/* Undo : 2 étapes — libère les claims, le payout reste en trace */}
      {undo?.open && (
        <ConfirmActionModal
          open={true}
          onClose={() => setUndo({ open: false, data: null, submitting: false })}
          onConfirm={handleUndo}
          submitting={undo?.submitting}
          title={"Undo payout"}
          confirmButtonName={"Undo payout now"}
          warning={
            <Alert severity="warning">
              This will release{" "}
              <span className={"font-bold"}>
                {undo?.data?.entry_count} ledger entries
              </span>{" "}
              (
              {formatCents(undo?.data?.total_amount_cents, undo?.data?.currency)}
              ) back to unpaid — they will show up again in the pending
              section. The payout record is kept as{" "}
              <span className={"font-bold"}>cancelled</span> for audit. Use
              this only if the real-world transfer did NOT happen.
            </Alert>
          }
          summary={
            <p className={"text-center"}>
              Undo the payout of{" "}
              <span className={"font-bold"}>
                {formatCents(
                  undo?.data?.total_amount_cents,
                  undo?.data?.currency
                )}
              </span>{" "}
              to{" "}
              <span className={"font-bold"}>
                {undo?.data?.super_name || undo?.data?.super_affiliate_id}
              </span>
              ?
            </p>
          }
        />
      )}
    </Card>
  );
};

export default SuperAffiliatePayouts;
