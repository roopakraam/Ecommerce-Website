"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  changeAdminPasswordAction,
  createShippingZoneAction,
  deleteShippingZoneAction,
  updateAdminProfileAction,
  updateNotificationPreferencesAction,
  updateShippingZoneAction,
  updateStoreDetailsAction,
} from "@/lib/actions/admin-settings";
import type {
  AdminAccountProfile,
  AdminSettingsBundle,
} from "@/lib/db/admin-settings";
import type { SettingsTab } from "@/lib/admin/settings";
import { formatPrice } from "@/lib/utils/format-price";
import {
  adminPasswordSchema,
  adminProfileSchema,
  formatStatesText,
  notificationPreferencesSchema,
  shippingZoneFormSchema,
  storeDetailsSchema,
  type AdminPasswordInput,
  type AdminPasswordValues,
  type AdminProfileInput,
  type AdminProfileValues,
  type NotificationPreferencesInput,
  type NotificationPreferencesValues,
  type ShippingZoneFormInput,
  type ShippingZoneFormValues,
  type StoreDetailsInput,
  type StoreDetailsValues,
} from "@/lib/validations/admin-settings";
import type { ShippingZone, StoreSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsPanelProps {
  tab: SettingsTab;
  data: AdminSettingsBundle;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function FormMessage({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (error) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
        {success}
      </p>
    );
  }
  return null;
}

function CheckboxField({
  id,
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3"
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function StoreDetailsForm({
  store,
  disabled,
}: {
  store: StoreSettings;
  disabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StoreDetailsInput, unknown, StoreDetailsValues>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: {
      store_name: store.store_name,
      currency: store.currency,
      tax_rate: Number(store.tax_rate),
      support_email: store.support_email ?? "",
      support_phone: store.support_phone ?? "",
    },
  });

  function onSubmit(values: StoreDetailsValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateStoreDetailsAction({ form: values });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Store details saved.");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">Store details</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Name, currency, and tax rate used across the store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="store_name">Store name</Label>
          <Input
            id="store_name"
            className="mt-1.5"
            disabled={disabled || isPending}
            {...form.register("store_name")}
          />
          <FieldError message={form.formState.errors.store_name?.message} />
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            disabled={disabled || isPending}
            {...form.register("currency")}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
          <FieldError message={form.formState.errors.currency?.message} />
        </div>

        <div>
          <Label htmlFor="tax_rate">Tax rate (%)</Label>
          <Input
            id="tax_rate"
            type="number"
            step="0.01"
            min={0}
            max={100}
            className="mt-1.5"
            disabled={disabled || isPending}
            {...form.register("tax_rate")}
          />
          <FieldError message={form.formState.errors.tax_rate?.message} />
        </div>

        <div>
          <Label htmlFor="support_email">Support email</Label>
          <Input
            id="support_email"
            type="email"
            className="mt-1.5"
            disabled={disabled || isPending}
            {...form.register("support_email")}
          />
          <FieldError message={form.formState.errors.support_email?.message} />
        </div>

        <div>
          <Label htmlFor="support_phone">Support phone</Label>
          <Input
            id="support_phone"
            className="mt-1.5"
            disabled={disabled || isPending}
            {...form.register("support_phone")}
          />
          <FieldError message={form.formState.errors.support_phone?.message} />
        </div>
      </div>

      <FormMessage error={error} success={success} />

      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? "Saving…" : "Save store details"}
      </Button>
    </form>
  );
}

function NotificationsForm({
  store,
  disabled,
}: {
  store: StoreSettings;
  disabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<
    NotificationPreferencesInput,
    unknown,
    NotificationPreferencesValues
  >({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      notify_email_customer: store.notify_email_customer,
      notify_whatsapp_customer: store.notify_whatsapp_customer,
      notify_email_admin: store.notify_email_admin,
      notify_whatsapp_admin: store.notify_whatsapp_admin,
      notify_low_stock: store.notify_low_stock,
      admin_notify_email: store.admin_notify_email ?? "",
      admin_notify_phone: store.admin_notify_phone ?? "",
    },
  });

  function onSubmit(values: NotificationPreferencesValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({
        form: values,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Notification preferences saved.");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Notification preferences
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose which channels fire for orders and stock alerts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField
          id="notify_email_customer"
          label="Customer email"
          hint="Order confirmation email"
          checked={form.watch("notify_email_customer")}
          disabled={disabled || isPending}
          onChange={(value) =>
            form.setValue("notify_email_customer", value, {
              shouldDirty: true,
            })
          }
        />
        <CheckboxField
          id="notify_whatsapp_customer"
          label="Customer WhatsApp"
          hint="Order confirmation WhatsApp"
          checked={form.watch("notify_whatsapp_customer")}
          disabled={disabled || isPending}
          onChange={(value) =>
            form.setValue("notify_whatsapp_customer", value, {
              shouldDirty: true,
            })
          }
        />
        <CheckboxField
          id="notify_email_admin"
          label="Admin email"
          hint="New order alerts to admin"
          checked={form.watch("notify_email_admin")}
          disabled={disabled || isPending}
          onChange={(value) =>
            form.setValue("notify_email_admin", value, { shouldDirty: true })
          }
        />
        <CheckboxField
          id="notify_whatsapp_admin"
          label="Admin WhatsApp"
          hint="New order alerts on WhatsApp"
          checked={form.watch("notify_whatsapp_admin")}
          disabled={disabled || isPending}
          onChange={(value) =>
            form.setValue("notify_whatsapp_admin", value, {
              shouldDirty: true,
            })
          }
        />
        <CheckboxField
          id="notify_low_stock"
          label="Low-stock alerts"
          hint="Warn when variants fall under threshold"
          checked={form.watch("notify_low_stock")}
          disabled={disabled || isPending}
          onChange={(value) =>
            form.setValue("notify_low_stock", value, { shouldDirty: true })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="admin_notify_email">Admin notify email</Label>
          <Input
            id="admin_notify_email"
            type="email"
            className="mt-1.5"
            disabled={disabled || isPending}
            {...form.register("admin_notify_email")}
          />
          <FieldError
            message={form.formState.errors.admin_notify_email?.message}
          />
        </div>
        <div>
          <Label htmlFor="admin_notify_phone">Admin notify phone</Label>
          <Input
            id="admin_notify_phone"
            className="mt-1.5"
            disabled={disabled || isPending}
            {...form.register("admin_notify_phone")}
          />
          <FieldError
            message={form.formState.errors.admin_notify_phone?.message}
          />
        </div>
      </div>

      <FormMessage error={error} success={success} />

      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? "Saving…" : "Save notifications"}
      </Button>
    </form>
  );
}

function emptyZoneForm(): ShippingZoneFormInput {
  return {
    name: "",
    states_text: "",
    flat_rate: 0,
    free_above: "",
    estimated_days_min: 3,
    estimated_days_max: 7,
    is_active: true,
    sort_order: 0,
  };
}

function ShippingZonesManager({
  zones,
  disabled,
}: {
  zones: ShippingZone[];
  disabled: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ShippingZoneFormInput, unknown, ShippingZoneFormValues>({
    resolver: zodResolver(shippingZoneFormSchema),
    defaultValues: emptyZoneForm(),
  });

  function startCreate() {
    setEditingId(null);
    setError(null);
    setSuccess(null);
    form.reset(emptyZoneForm());
  }

  function startEdit(zone: ShippingZone) {
    setEditingId(zone.id);
    setError(null);
    setSuccess(null);
    form.reset({
      name: zone.name,
      states_text: formatStatesText(zone.states),
      flat_rate: Number(zone.flat_rate),
      free_above: zone.free_above ?? "",
      estimated_days_min: zone.estimated_days_min ?? "",
      estimated_days_max: zone.estimated_days_max ?? "",
      is_active: zone.is_active,
      sort_order: zone.sort_order,
    });
  }

  function onSubmit(values: ShippingZoneFormValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = editingId
        ? await updateShippingZoneAction({ zoneId: editingId, form: values })
        : await createShippingZoneAction({ form: values });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(editingId ? "Zone updated." : "Zone created.");
      startCreate();
      router.refresh();
    });
  }

  function handleDelete(zone: ShippingZone) {
    const confirmed = window.confirm(`Delete shipping zone “${zone.name}”?`);
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await deleteShippingZoneAction(zone.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (editingId === zone.id) {
        startCreate();
      }
      setSuccess("Zone deleted.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? "Edit shipping zone" : "Add shipping zone"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Empty states list means the zone applies to all India.
            </p>
          </div>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startCreate}
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
              New zone
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="zone_name">Zone name</Label>
            <Input
              id="zone_name"
              className="mt-1.5"
              disabled={disabled || isPending}
              {...form.register("name")}
            />
            <FieldError message={form.formState.errors.name?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="states_text">States (comma-separated)</Label>
            <textarea
              id="states_text"
              rows={3}
              className="mt-1.5 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Leave empty for All India, or e.g. Maharashtra, Karnataka"
              disabled={disabled || isPending}
              {...form.register("states_text")}
            />
            <FieldError message={form.formState.errors.states_text?.message} />
          </div>

          <div>
            <Label htmlFor="flat_rate">Flat rate (₹)</Label>
            <Input
              id="flat_rate"
              type="number"
              step="0.01"
              min={0}
              className="mt-1.5"
              disabled={disabled || isPending}
              {...form.register("flat_rate")}
            />
            <FieldError message={form.formState.errors.flat_rate?.message} />
          </div>

          <div>
            <Label htmlFor="free_above">Free above (₹)</Label>
            <Input
              id="free_above"
              type="number"
              step="0.01"
              min={0}
              className="mt-1.5"
              disabled={disabled || isPending}
              {...form.register("free_above")}
            />
            <FieldError message={form.formState.errors.free_above?.message} />
          </div>

          <div>
            <Label htmlFor="estimated_days_min">Min days</Label>
            <Input
              id="estimated_days_min"
              type="number"
              min={0}
              className="mt-1.5"
              disabled={disabled || isPending}
              {...form.register("estimated_days_min")}
            />
            <FieldError
              message={form.formState.errors.estimated_days_min?.message}
            />
          </div>

          <div>
            <Label htmlFor="estimated_days_max">Max days</Label>
            <Input
              id="estimated_days_max"
              type="number"
              min={0}
              className="mt-1.5"
              disabled={disabled || isPending}
              {...form.register("estimated_days_max")}
            />
            <FieldError
              message={form.formState.errors.estimated_days_max?.message}
            />
          </div>

          <div>
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              className="mt-1.5"
              disabled={disabled || isPending}
              {...form.register("sort_order")}
            />
            <FieldError message={form.formState.errors.sort_order?.message} />
          </div>

          <div className="flex items-end">
            <CheckboxField
              id="zone_is_active"
              label="Active"
              checked={form.watch("is_active")}
              disabled={disabled || isPending}
              onChange={(value) =>
                form.setValue("is_active", value, { shouldDirty: true })
              }
            />
          </div>
        </div>

        <FormMessage error={error} success={success} />

        <Button type="submit" disabled={disabled || isPending}>
          {isPending
            ? "Saving…"
            : editingId
              ? "Update zone"
              : "Create zone"}
        </Button>
      </form>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Shipping zones
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Flat rates and free-shipping thresholds by region.
          </p>
        </div>

        {zones.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No shipping zones"
              description="Add a zone to configure delivery rates."
              tone="dark"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Zone</th>
                  <th className="px-5 py-3 font-semibold">Coverage</th>
                  <th className="px-5 py-3 font-semibold">Rate</th>
                  <th className="px-5 py-3 font-semibold">ETA</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr
                    key={zone.id}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {zone.name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {zone.states.length === 0
                        ? "All India"
                        : zone.states.join(", ")}
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {formatPrice(Number(zone.flat_rate))}
                      {zone.free_above != null ? (
                        <span className="block text-xs text-muted-foreground">
                          Free above {formatPrice(Number(zone.free_above))}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {zone.estimated_days_min != null ||
                      zone.estimated_days_max != null
                        ? `${zone.estimated_days_min ?? "?"}–${zone.estimated_days_max ?? "?"} days`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          zone.is_active
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        {zone.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={disabled || isPending}
                          onClick={() => startEdit(zone)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={disabled || isPending}
                          onClick={() => handleDelete(zone)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AccountForms({ account }: { account: AdminAccountProfile }) {
  const router = useRouter();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const profileForm = useForm<AdminProfileInput, unknown, AdminProfileValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      display_name: account.displayName ?? "",
    },
  });

  const passwordForm = useForm<
    AdminPasswordInput,
    unknown,
    AdminPasswordValues
  >({
    resolver: zodResolver(adminPasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  function onProfileSubmit(values: AdminProfileValues) {
    setProfileError(null);
    setProfileSuccess(null);
    startProfileTransition(async () => {
      const result = await updateAdminProfileAction({ form: values });
      if (!result.success) {
        setProfileError(result.error);
        return;
      }
      setProfileSuccess("Profile updated.");
      router.refresh();
    });
  }

  function onPasswordSubmit(values: AdminPasswordValues) {
    setPasswordError(null);
    setPasswordSuccess(null);
    startPasswordTransition(async () => {
      const result = await changeAdminPasswordAction({ form: values });
      if (!result.success) {
        setPasswordError(result.error);
        return;
      }
      setPasswordSuccess("Password changed.");
      passwordForm.reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
        className="space-y-4 rounded-xl border border-border bg-card p-5"
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Display name and account email for this admin login.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              className="mt-1.5"
              disabled={isProfilePending}
              {...profileForm.register("display_name")}
            />
            <FieldError
              message={profileForm.formState.errors.display_name?.message}
            />
          </div>
          <div>
            <Label htmlFor="account_email">Email</Label>
            <Input
              id="account_email"
              className="mt-1.5"
              value={account.email}
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-muted-foreground capitalize">
              Role: {account.role.replace("_", " ")}
            </p>
          </div>
        </div>

        <FormMessage error={profileError} success={profileSuccess} />

        <Button type="submit" disabled={isProfilePending}>
          {isProfilePending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <form
        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        className="space-y-4 rounded-xl border border-border bg-card p-5"
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Change password
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Confirm your current password, then set a new one.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:max-w-md">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              className="mt-1.5"
              disabled={isPasswordPending}
              {...passwordForm.register("current_password")}
            />
            <FieldError
              message={passwordForm.formState.errors.current_password?.message}
            />
          </div>
          <div>
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              className="mt-1.5"
              disabled={isPasswordPending}
              {...passwordForm.register("new_password")}
            />
            <FieldError
              message={passwordForm.formState.errors.new_password?.message}
            />
          </div>
          <div>
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              className="mt-1.5"
              disabled={isPasswordPending}
              {...passwordForm.register("confirm_password")}
            />
            <FieldError
              message={passwordForm.formState.errors.confirm_password?.message}
            />
          </div>
        </div>

        <FormMessage error={passwordError} success={passwordSuccess} />

        <Button type="submit" disabled={isPasswordPending}>
          {isPasswordPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

export function SettingsPanel({ tab, data }: SettingsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const storeDisabled = !data.settingsAvailable;

  function onTabChange(value: string) {
    const params = new URLSearchParams();
    if (value !== "store") {
      params.set("tab", value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="space-y-4">
      {!data.settingsAvailable ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Apply migration{" "}
          <code className="text-xs">20260722099000_store_settings.sql</code> to
          enable store, shipping, and notification settings. Account password
          change still works.
        </p>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={onTabChange}
        className={isPending ? "opacity-80" : undefined}
      >
        <TabsList>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <StoreDetailsForm store={data.store} disabled={storeDisabled} />
        </TabsContent>
        <TabsContent value="shipping">
          <ShippingZonesManager
            zones={data.zones}
            disabled={storeDisabled}
          />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsForm store={data.store} disabled={storeDisabled} />
        </TabsContent>
        <TabsContent value="account">
          <AccountForms account={data.account} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
