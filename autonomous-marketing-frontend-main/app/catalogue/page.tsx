"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ApiError, apiRequest } from "@/lib/api/client";
import {
  getBusinessAccountId,
  getTenantId,
} from "@/lib/auth";
import { DashboardTopHeader } from "@/components/navigation/dashboard-top-header";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { UserAccountMenu } from "@/components/navigation/user-account-menu";
import { Menu, Sparkles, RefreshCw, Upload, Trash2, Image as ImageIcon } from "lucide-react";

type AssetResponse = {
  id: string;
  tenant_id: string;
  original_filename: string;
  mime_type: string;
  source: string;
  status: string;
  usage_count: number;
  image_url: string;
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILES_PER_SELECTION = 20;

export default function CataloguePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [businessAccountId, setBusinessAccountId] =
    useState<number | null>(null);

  const [tenantId, setTenantId] =
    useState<string | null>(null);

  const [authReady, setAuthReady] = useState(false);

  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dragActive, setDragActive] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAssetImageUrl = (url: string) => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      if (parsed.pathname.startsWith("/assets/")) {
        return `${apiUrl.replace(/\/$/, "")}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      return `${apiUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
  };

  /*
   * ---------------------------------------------------------
   * Load authentication context from localStorage
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const storedBusinessAccountId = getBusinessAccountId();
    const storedTenantId = getTenantId();

    setBusinessAccountId(storedBusinessAccountId);
    setTenantId(storedTenantId);
    setAuthReady(true);
  }, []);

  /*
   * ---------------------------------------------------------
   * Load catalogue assets
   * ---------------------------------------------------------
   */
  const loadAssets = useCallback(async () => {
    if (
      businessAccountId === null ||
      !tenantId
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await apiRequest<AssetResponse[]>(
          `/assets?business_account_id=${businessAccountId}`,
          {
            method: "GET",
            headers: {
              "X-Tenant-ID": tenantId,
            },
          },
        );

      setAssets(response);
    } catch (err) {
      console.error(
        "Failed to load catalogue assets:",
        err,
      );

      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(
          "Unable to load your catalogue.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    businessAccountId,
    tenantId,
  ]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    void loadAssets();
  }, [
    authReady,
    loadAssets,
  ]);

  /*
   * ---------------------------------------------------------
   * Validate files
   * ---------------------------------------------------------
   */
  const validateFiles = (
    files: File[],
  ): File[] => {
    if (files.length === 0) {
      return [];
    }

    if (
      files.length >
      MAX_FILES_PER_SELECTION
    ) {
      setError(
        `You can upload up to ${MAX_FILES_PER_SELECTION} images at a time.`,
      );

      return [];
    }

    const invalidFiles =
      files.filter(
        (file) =>
          !ACCEPTED_TYPES.includes(
            file.type,
          ),
      );

    if (invalidFiles.length > 0) {
      setError(
        "Only JPG, JPEG, PNG, and WEBP images are supported.",
      );

      return [];
    }

    return files;
  };

  /*
   * ---------------------------------------------------------
   * Upload files
   * ---------------------------------------------------------
   */
  const uploadFiles = async (
    selectedFiles: File[],
  ) => {
    if (
      businessAccountId === null ||
      !tenantId
    ) {
      setError(
        "Your workspace session is not ready. Please refresh the page and try again.",
      );

      return;
    }

    const files =
      validateFiles(selectedFiles);

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    let uploadedCount = 0;
    let failedCount = 0;

    try {
      /*
       * Upload one file at a time.
       *
       * This keeps the backend/database state
       * deterministic.
       */
      for (const file of files) {
        try {
          const formData = new FormData();

          formData.append(
            "file",
            file,
          );

          await apiRequest<AssetResponse>(
            `/assets/upload?business_account_id=${businessAccountId}`,
            {
              method: "POST",
              body: formData,
              headers: {
                "X-Tenant-ID": tenantId,
              },
            },
          );

          uploadedCount += 1;
        } catch (err) {
          console.error(
            `Failed to upload ${file.name}:`,
            err,
          );

          failedCount += 1;
        }
      }

      /*
       * Reload from backend after uploading.
       *
       * Uploading can create new assets or return an
       * existing deduplicated asset, so the backend
       * response remains the source of truth.
       */
      await loadAssets();

      if (
        uploadedCount > 0 &&
        failedCount === 0
      ) {
        setSuccess(
          `${uploadedCount} ${
            uploadedCount === 1
              ? "image"
              : "images"
          } uploaded successfully.`,
        );
      } else if (
        uploadedCount > 0 &&
        failedCount > 0
      ) {
        setSuccess(
          `${uploadedCount} uploaded successfully. ${failedCount} failed.`,
        );
      } else {
        setError(
          "No images were uploaded.",
        );
      }
    } finally {
      setUploading(false);

      /*
       * Allow selecting the same file again.
       */
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * File input
   * ---------------------------------------------------------
   */
  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files ?? [],
    );

    void uploadFiles(files);
  };

  /*
   * ---------------------------------------------------------
   * Drag & drop
   * ---------------------------------------------------------
   */
  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!uploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    if (uploading) {
      return;
    }

    const files = Array.from(
      event.dataTransfer.files,
    );

    void uploadFiles(files);
  };

  /*
   * ---------------------------------------------------------
   * Delete asset
   * ---------------------------------------------------------
   */
  const handleDelete = async (
    asset: AssetResponse,
  ) => {
    if (
      businessAccountId === null ||
      !tenantId
    ) {
      setError(
        "Your workspace session is not ready. Please refresh the page.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${asset.original_filename}" from your catalogue?`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(asset.id);
    setError(null);
    setSuccess(null);

    try {
      /*
       * First delete from the backend.
       *
       * We only update the UI after the backend confirms
       * the deletion was successful.
       */
      await apiRequest<void>(
        `/assets/${encodeURIComponent(
          asset.id,
        )}?business_account_id=${businessAccountId}`,
        {
          method: "DELETE",
          headers: {
            "X-Tenant-ID": tenantId,
          },
        },
      );

      /*
       * IMPORTANT:
       * Remove the deleted asset from React state
       * immediately.
       *
       * This makes the card disappear without requiring
       * a page refresh.
       */
      setAssets((currentAssets) =>
        currentAssets.filter(
          (currentAsset) =>
            currentAsset.id !== asset.id,
        ),
      );

      setSuccess(
        `"${asset.original_filename}" was deleted.`,
      );
    } catch (err) {
      console.error(
        "Failed to delete catalogue asset:",
        err,
      );

      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(
          "Unable to delete this image.",
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Missing workspace context
   * ---------------------------------------------------------
   */
  if (
    authReady &&
    (
      businessAccountId === null ||
      !tenantId
    )
  ) {
    return (
      <div className="min-h-screen bg-card text-foreground">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-h-screen md:pl-[230px]">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                className="ui-button-secondary flex h-9 w-9 items-center justify-center border border-border"
              >
                <Menu size={19} />
              </button>
              <div className="flex items-center gap-2">
                <img
                  src="/logo/app logo.png"
                  alt="maeaco logo"
                  className="h-7 w-7 rounded-lg object-contain"
                />
                <span className="text-base font-bold tracking-tight text-foreground">maeaco</span>
              </div>
            </div>
            <UserAccountMenu />
          </header>
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">
                Catalogue
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Manage the product and brand images your AI marketing campaigns can use.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="font-medium text-neutral-900">
                Workspace context required
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your business workspace could not be loaded. Please refresh the page or complete onboarding.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * Page
   * ---------------------------------------------------------
   */
  return (
    <div className="min-h-screen bg-card text-foreground">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen md:pl-[230px]">
        <DashboardTopHeader title="Product Catalogue" subtitle="Original product photos for your campaigns"
          onMenuClick={() => setSidebarOpen(true)} actions={<>

            <button type="button" onClick={() => void loadAssets()} disabled={loading}
              aria-label="Refresh product catalogue" className="ui-button-secondary inline-flex min-h-11 items-center gap-2 border border-border px-3 text-sm disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </>} />

        {/* Main Content Area */}
        <div className="mx-auto max-w-[1450px] px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">

            {/* Header */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Catalogue
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Upload original product photos for your campaigns. Your business logo is managed separately in brand settings.
                </p>
              </div>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              uploading ||
              !authReady
            }
            className="ui-button-primary inline-flex h-11 items-center justify-center px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : "Upload product photos"}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={
            uploading ||
            !authReady
          }
        />

        {/* Messages */}
        {error && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="shrink-0 underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                setSuccess(null)
              }
              className="shrink-0 underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            "mt-7 rounded-xl border border-dashed p-8 text-center transition-colors sm:p-12",
            dragActive
              ? "border-foreground bg-muted/40"
              : "border-border",
          ].join(" ")}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
            ↑
          </div>

          <h2 className="mt-4 text-sm font-semibold">
            Upload catalogue images
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Drag and drop images here, or choose
            files from your device.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            JPG, JPEG, PNG, or WEBP • Up to{" "}
            {MAX_FILES_PER_SELECTION} images per
            selection
          </p>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              uploading ||
              !authReady
            }
            className="ui-button-secondary mt-5 inline-flex h-10 items-center justify-center border border-border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : "Choose files"}
          </button>
        </div>

        {/* Catalogue */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Your images
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Loading..."
                : `${assets.length} ${
                    assets.length === 1
                      ? "image"
                      : "images"
                  }`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <div className="aspect-square animate-pulse bg-muted" />

                  <div className="space-y-2 p-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />

                    <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading &&
            assets.length === 0 && (
              <div className="rounded-xl border border-border p-8 text-center sm:p-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
                  ▧
                </div>

                <h3 className="mt-4 text-sm font-semibold">
                  Your catalogue is empty
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Upload product, service, or brand
                  images so your AI campaigns can use
                  them when creating marketing content.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    uploading ||
                    !authReady
                  }
                  className="ui-button-primary mt-5 inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Upload your first image
                </button>
              </div>
            )}

          {/* Images */}
          {!loading &&
            assets.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {assets.map((asset) => {
                  const isDeleting =
                    deletingId === asset.id;

                  return (
                    <article
                      key={asset.id}
                      className="overflow-hidden rounded-xl border border-border bg-background"
                    >
                      <div className="relative aspect-square overflow-hidden bg-neutral-100 flex items-center justify-center">
                        <img
                          src={getAssetImageUrl(asset.image_url)}
                          alt={
                            asset.original_filename
                          }
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallbackApplied) {
                              target.dataset.fallbackApplied = "true";
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                              try {
                                const urlObj = new URL(asset.image_url);
                                target.src = `${apiUrl}${urlObj.pathname}${urlObj.search}`;
                              } catch {
                                target.src = `${apiUrl}/assets/${asset.tenant_id}/${asset.id}`;
                              }
                            }
                          }}
                        />

                        {isDeleting && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                            <span className="text-sm font-medium">
                              Deleting...
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-medium"
                            title={
                              asset.original_filename
                            }
                          >
                            {
                              asset.original_filename
                            }
                          </p>

                          <p className="mt-1 text-xs uppercase text-muted-foreground">
                            {asset.mime_type.replace(
                              "image/",
                              "",
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          aria-label={`Delete ${asset.original_filename}`}
                          title="Delete image"
                          onClick={() =>
                            void handleDelete(
                              asset,
                            )
                          }
                          disabled={
                            uploading ||
                            isDeleting
                          }
                          className="ui-button-secondary flex h-9 w-9 shrink-0 items-center justify-center border border-border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          🗑
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>
          </div>
        </div>
      </main>
    </div>
  );
}
