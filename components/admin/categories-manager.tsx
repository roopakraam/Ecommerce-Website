"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/admin-categories";
import type { AdminCategoryListItem } from "@/lib/db/admin-categories";
import {
  adminCategoryFormSchema,
  type AdminCategoryFormInput,
} from "@/lib/validations/admin-category";
import { slugify } from "@/lib/utils/slugify";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoriesManagerProps {
  categories: AdminCategoryListItem[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AdminCategoryFormInput>({
    resolver: zodResolver(adminCategoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const watchedName = form.watch("name");

  useEffect(() => {
    if (editingId) {
      return;
    }
    const nextSlug = slugify(watchedName || "");
    if (nextSlug && form.getValues("slug") !== nextSlug) {
      form.setValue("slug", nextSlug, { shouldValidate: false });
    }
  }, [editingId, watchedName, form]);

  function startCreate() {
    setEditingId(null);
    setErrorMessage(null);
    form.reset({ name: "", slug: "" });
  }

  function startEdit(category: AdminCategoryListItem) {
    setEditingId(category.id);
    setErrorMessage(null);
    form.reset({
      name: category.name,
      slug: category.slug,
    });
  }

  function onSubmit(values: AdminCategoryFormInput) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = editingId
        ? await updateCategoryAction({
            categoryId: editingId,
            form: values,
          })
        : await createCategoryAction({ form: values });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      startCreate();
      router.refresh();
    });
  }

  function handleDelete(category: AdminCategoryListItem) {
    const confirmed = window.confirm(
      `Delete category “${category.name}”? Products must be reassigned first.`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      if (editingId === category.id) {
        startCreate();
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {errorMessage ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
            {errorMessage}
          </p>
        ) : null}

        {categories.length === 0 ? (
          <EmptyState
            tone="dark"
            title="No categories yet"
            description="Use the form on the right to create your first category."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {category.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {category.slug}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {category.product_count}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => startEdit(category)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending || category.product_count > 0}
                          onClick={() => handleDelete(category)}
                          className="border-destructive/40 text-red-300 hover:bg-destructive/10"
                          title={
                            category.product_count > 0
                              ? "Reassign products before deleting"
                              : "Delete category"
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit category" : "New category"}
          </h2>
          {editingId ? (
            <Button type="button" size="sm" variant="ghost" onClick={startCreate}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          ) : null}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              {...form.register("name")}
              placeholder="Oversized Tees"
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-red-300">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              {...form.register("slug")}
              placeholder="oversized-tees"
            />
            {form.formState.errors.slug ? (
              <p className="text-xs text-red-300">
                {form.formState.errors.slug.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Saving..."
              : editingId
                ? "Save category"
                : "Create category"}
          </Button>
        </form>
      </aside>
    </div>
  );
}
