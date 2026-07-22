import { Button } from "@mui/material";
import { useState } from "react";
import MuiModal from "./MuiModal";

/**
 * Confirmation en 2 étapes pour les actions ARGENT/irréversibles :
 *   étape 1 : avertissement détaillé (prop `warning`) → "I understand"
 *   étape 2 : récapitulatif court (prop `summary`) → bouton rouge final
 *
 * Convention d'usage (gabarit promotions) : monter conditionnellement —
 *   {state.open && <ConfirmActionModal open={true} … />}
 * — le remontage remet l'étape à 1 à chaque ouverture.
 */
const ConfirmActionModal = ({
  open,
  onClose,
  onConfirm,
  title = "Notice!",
  warning,
  summary,
  confirmButtonName = "Confirm",
  submitting = false,
}) => {
  const [step, setStep] = useState(1);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <MuiModal
      open={open}
      onClose={handleClose}
      title={title}
      displayButtons={true}
      buttonChildren={
        step === 1 ? (
          <>
            <Button variant="outlined" onClick={handleClose}>
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
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={submitting}
              onClick={onConfirm}
            >
              {submitting ? "Submitting..." : confirmButtonName}
            </Button>
          </>
        )
      }
    >
      {step === 1 ? warning : summary}
    </MuiModal>
  );
};

export default ConfirmActionModal;
