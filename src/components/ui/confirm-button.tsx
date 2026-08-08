"use client";

import { Button } from "./button";

export function ConfirmButton({
  confirmText,
  ...props
}: React.ComponentProps<typeof Button> & { confirmText: string }) {
  return (
    <Button
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    />
  );
}
