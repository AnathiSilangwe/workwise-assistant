import { Copy, Download, RefreshCw, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type OutputActionsProps = {
  text: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
  filename?: string;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  favoriteDisabled?: boolean;
};

export function OutputActions({
  text,
  onRegenerate,
  regenerating,
  filename = "workwise-output.txt",
  favorite,
  onToggleFavorite,
  favoriteDisabled,
}: OutputActionsProps) {
  const disabled = !text;
  const copy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button size="sm" variant="ghost" disabled={disabled} onClick={copy} title="Copy">
        <Copy className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" disabled={disabled} onClick={download} title="Download">
        <Download className="size-4" />
      </Button>
      {onRegenerate && (
        <Button
          size="sm"
          variant="ghost"
          disabled={regenerating || disabled}
          onClick={onRegenerate}
          title="Regenerate"
        >
          {regenerating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        </Button>
      )}
      {onToggleFavorite && (
        <Button
          size="sm"
          variant="ghost"
          disabled={favoriteDisabled || disabled}
          onClick={onToggleFavorite}
          title={favorite ? "Unsave" : "Save"}
          className={favorite ? "text-rose-500" : ""}
        >
          <Heart className={`size-4 ${favorite ? "fill-current" : ""}`} />
        </Button>
      )}
    </div>
  );
}
