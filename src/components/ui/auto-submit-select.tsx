"use client";

import { Select } from "./field";

/** A <select> that submits its parent <form> as soon as the value changes. */
export function AutoSubmitSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <Select
      {...props}
      onChange={(e) => {
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
