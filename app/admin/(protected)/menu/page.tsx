"use client";

import Image from "next/image";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MenuItemFormModal } from "@/components/admin/menu-item-form-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { FirebaseSetupAlert } from "@/components/shared/firebase-setup-alert";
import { PageLoader } from "@/components/shared/page-loader";
import { buttonVariants } from "@/components/ui/button";
import { useAdminData } from "@/components/providers/admin-data-provider";
import { isFirebaseConfigured } from "@/lib/env";
import {
  createMenuItem,
  deleteMenuItem,
  seedStarterMenu,
  updateMenuItem,
} from "@/lib/firebase/firestore";
import type { MenuFormValues, MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=60";

export default function AdminMenuPage() {
  const { menuItems, menuLoading, menuError } = useAdminData();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [seeding, setSeeding] = useState(false);

  const categoriesCount = useMemo(
    () => new Set(menuItems.map((item) => item.category)).size,
    [menuItems],
  );

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleSubmit = async (values: MenuFormValues) => {
    try {
      setSaving(true);

      if (editingItem) {
        await updateMenuItem(editingItem.id, values);
        toast.success("Menu item updated.");
      } else {
        await createMenuItem(values);
        toast.success("Menu item added.");
      }

      setModalOpen(false);
      setEditingItem(null);
    } catch (menuError) {
      const message =
        menuError instanceof Error
          ? menuError.message
          : "Unable to save the menu item.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      setDeletingId(itemId);
      await deleteMenuItem(itemId);
      toast.success("Menu item deleted.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the menu item.";
      toast.error(message);
    } finally {
      setDeletingId("");
    }
  };

  const handleSeedMenu = async () => {
    try {
      setSeeding(true);
      await seedStarterMenu();
      toast.success("Starter cafe menu loaded.");
    } catch (seedError) {
      const message =
        seedError instanceof Error
          ? seedError.message
          : "Unable to load the starter menu.";
      toast.error(message);
    } finally {
      setSeeding(false);
    }
  };

  if (menuLoading) {
    return <PageLoader label="Loading menu management..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-yellow-300/75">
            Menu
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Manage menu items
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Add and update dishes instantly. The customer menu refreshes in real
            time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSeedMenu}
            disabled={seeding}
            className={buttonVariants({
              variant: "secondary",
              className: "justify-center sm:w-auto",
            })}
          >
            <Sparkles className="h-4 w-4" />
            {seeding ? "Loading Starter Menu..." : "Load Starter Menu"}
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className={buttonVariants({ className: "justify-center sm:w-auto" })}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {!isFirebaseConfigured ? (
        <FirebaseSetupAlert />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="panel interactive-lift rounded-[1.5rem] p-5">
          <p className="text-sm text-[var(--muted)]">Published items</p>
          <h2 className="mt-2 text-3xl font-semibold">{menuItems.length}</h2>
        </article>
        <article className="panel interactive-lift rounded-[1.5rem] p-5">
          <p className="text-sm text-[var(--muted)]">Categories</p>
          <h2 className="mt-2 text-3xl font-semibold">{categoriesCount}</h2>
        </article>
        <article className="panel interactive-lift rounded-[1.5rem] p-5">
          <p className="text-sm text-[var(--muted)]">Unavailable items</p>
          <h2 className="mt-2 text-3xl font-semibold">
            {menuItems.filter((item) => item.isAvailable === false).length}
          </h2>
        </article>
      </section>

      {menuError ? (
        <EmptyState title="Unable to load the menu" description={menuError} />
      ) : null}

      {!menuError && menuItems.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="Menu is empty"
            description="Load the starter cafe menu for pizzas, burgers, coffees, and snacks, or create your first custom item."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSeedMenu}
              disabled={seeding}
              className={buttonVariants({ className: "justify-center" })}
            >
              <Sparkles className="h-4 w-4" />
              {seeding ? "Loading Starter Menu..." : "Load Starter Menu"}
            </button>
          </div>
        </div>
      ) : null}

      {!menuError && menuItems.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {menuItems.map((item) => (
            <article
              key={item.id}
              className="panel interactive-lift overflow-hidden rounded-[1.75rem]"
            >
              <div className="flex gap-4 p-5">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-[1.2rem]">
                  <Image
                    src={item.image || FALLBACK_IMAGE}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{item.name}</h2>
                    <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                      {item.type === "veg" ? "Veg" : "Non-Veg"}
                    </span>
                    {item.popular ? (
                      <span className="rounded-full bg-yellow-400/14 px-3 py-1 text-xs font-semibold text-yellow-300">
                        Trending
                      </span>
                    ) : null}
                    {item.isAvailable === false ? (
                      <span className="rounded-full border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-1 text-xs font-semibold text-[var(--danger)]">
                        Unavailable
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    #{item.category}
                  </p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-lg font-semibold text-[var(--primary)]">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-[var(--border)] px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(item);
                    setModalOpen(true);
                  }}
                  className={buttonVariants({
                    variant: "secondary",
                    className: "sm:w-auto",
                  })}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className={buttonVariants({
                    variant: "danger",
                    className: "sm:w-auto",
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <MenuItemFormModal
        open={modalOpen}
        item={editingItem}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingItem(null);
          }
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
