"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_MENU_CATEGORIES } from "@/lib/constants";
import type { MenuFormValues, MenuItem } from "@/lib/types";

const menuItemSchema = z.object({
  category: z.string().min(2, "Category must be at least 2 characters"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  image: z
    .string()
    .url("Enter a valid image URL")
    .refine((value) => value.startsWith("https://"), {
      message: "Image URL must use https:// for security",
    }),
  isAvailable: z.boolean().default(true),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or less"),
  popular: z.boolean().default(false),
  price: z.coerce
    .number()
    .positive("Price must be greater than zero")
    .max(99999, "Price seems too high"),
  type: z.enum(["veg", "non-veg"]),
});

type MenuItemFormInput = z.input<typeof menuItemSchema>;
type MenuItemFormOutput = z.output<typeof menuItemSchema>;

type MenuItemFormModalProps = {
  open: boolean;
  item: MenuItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: MenuFormValues) => Promise<void>;
};

export function MenuItemFormModal({
  item,
  onClose,
  onSubmit,
  open,
  saving,
}: MenuItemFormModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<MenuItemFormInput, unknown, MenuItemFormOutput>({
    defaultValues: {
      category: DEFAULT_MENU_CATEGORIES[0],
      description: "",
      image: "",
      isAvailable: true,
      name: "",
      popular: false,
      price: 0,
      type: "veg",
    },
    resolver: zodResolver(menuItemSchema),
  });

  useEffect(() => {
    reset(
      item
        ? {
            category: item.category,
            description: item.description ?? "",
            image: item.image,
            isAvailable: item.isAvailable !== false,
            name: item.name,
            popular: item.popular ?? false,
            price: item.price,
            type: item.type,
          }
        : {
            category: DEFAULT_MENU_CATEGORIES[0],
            description: "",
            image: "",
            isAvailable: true,
            name: "",
            popular: false,
            price: 0,
            type: "veg",
          },
    );
  }, [item, reset]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8 backdrop-blur-sm">
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-yellow-300/75">
              Menu Editor
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {item ? "Edit menu item" : "Add menu item"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)]"
            aria-label="Close menu item form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(async (values) => onSubmit(values))}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Item name</label>
            <input
              {...register("name")}
              className="field"
              placeholder="Cappuccino"
            />
            {errors.name ? (
              <p className="mt-2 text-sm text-[var(--danger)]">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <textarea
              {...register("description")}
              className="field min-h-[80px] resize-y"
              placeholder="Rich espresso with steamed milk and a light foam layer."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Price (₹)</label>
              <input
                {...register("price")}
                type="number"
                min="1"
                step="1"
                className="field"
                placeholder="160"
              />
              {errors.price ? (
                <p className="mt-2 text-sm text-[var(--danger)]">
                  {errors.price.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Type</label>
              <select {...register("type")} className="field">
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <input
                {...register("category")}
                className="field"
                list="menu-categories"
                placeholder="Coffee"
              />
              <datalist id="menu-categories">
                {DEFAULT_MENU_CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category ? (
                <p className="mt-2 text-sm text-[var(--danger)]">
                  {errors.category.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium">
                <input
                  {...register("popular")}
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Highlight as popular
              </label>
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium">
                <input
                  {...register("isAvailable")}
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Available to order
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Image URL</label>
            <input
              {...register("image")}
              className="field"
              placeholder="https://images.unsplash.com/..."
            />
            {errors.image ? (
              <p className="mt-2 text-sm text-[var(--danger)]">
                {errors.image.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={buttonVariants({
                variant: "ghost",
                className: "justify-center sm:w-auto",
              })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={buttonVariants({
                className: "justify-center sm:w-auto",
              })}
            >
              {saving ? "Saving..." : item ? "Update item" : "Create item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
