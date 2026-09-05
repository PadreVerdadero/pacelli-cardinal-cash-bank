"use client";

type Props = {
  children: React.ReactNode;
  className?: string;
  message?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
};

export function ConfirmDeleteButton({
  children,
  className,
  message = "Are you sure you want to delete this?",
  formAction,
  name,
  value,
}: Props) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formAction={formAction}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {children}
    </button>
  );
}
