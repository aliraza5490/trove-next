"use client";

import * as React from "react";
import { AlertTriangle, Trash2, Info, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  icon?: React.ReactNode;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  loading = false,
  onConfirm,
  icon,
}: ConfirmModalProps) {
  const getIcon = () => {
    if (icon) return icon;
    if (variant === "destructive") {
      return <Trash2 className="h-5 w-5 text-destructive" />;
    }
    if (variant === "warning") {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
    return <Info className="h-5 w-5 text-primary" />;
  };

  const getIconBg = () => {
    if (variant === "destructive") {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    if (variant === "warning") {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 gap-5 sm:max-w-md rounded-xl">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-2xs",
              getIconBg()
            )}
          >
            {getIcon()}
          </div>
          <div className="grid gap-1.5 pt-0.5 min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold text-foreground leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 border-t-0 p-0 pt-2 flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 sm:flex-none text-xs sm:text-sm h-9"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none text-xs sm:text-sm h-9 min-w-[90px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
