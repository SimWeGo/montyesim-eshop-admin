import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Alert, Button, IconButton, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import MuiModal from "./MuiModal";

/**
 * Affichage ONE-SHOT d'une clé API (création affilié/super, rotation).
 * Le back ne stocke que le hash (§A4/§A7) : après fermeture, la clé est
 * définitivement irrécupérable → la fermeture par backdrop/Escape est
 * neutralisée, seul le bouton explicite ferme.
 */
const ApiKeyRevealModal = ({ open, onClose, apiKey, message }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success("API key copied to clipboard");
    } catch {
      // Clipboard API indisponible (permissions/HTTP) → copie manuelle
      toast.error("Copy failed — select the key and copy it manually");
    }
  };

  return (
    <MuiModal
      open={open}
      onClose={() => {}}
      title={"API key — shown only once"}
      displayButtons={true}
      buttonChildren={
        <Button variant="contained" color="primary" onClick={onClose}>
          I saved this key — close
        </Button>
      }
    >
      <div className={"flex flex-col gap-[1rem]"}>
        <Alert severity="warning">
          Save this key securely now. It will{" "}
          <span className={"font-bold"}>never be shown again</span> — only a
          hash is stored server-side. If it is lost, a new key must be
          generated (the old one is then invalidated).
        </Alert>
        <div
          className={
            "flex flex-row items-center gap-[0.5rem] rounded-lg border p-3"
          }
        >
          <code className={"font-mono break-all flex-1"}>{apiKey}</code>
          <Tooltip title={"Copy to clipboard"} placement={"top"}>
            <IconButton color="primary" aria-label="copy" onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
        {message && <p className={"text-sm"}>{message}</p>}
      </div>
    </MuiModal>
  );
};

export default ApiKeyRevealModal;
