"use client";

import {
  getBusinessChannels,
  getGoogleBusinessSelection,
  getLinkedInSelection,
  getMetaOAuthSelection,
  selectGoogleBusinessLocation,
  selectLinkedInAccount,
  selectMetaOAuthAccount,
  startPlatformOAuth,
  type BusinessChannel,
  type GoogleBusinessLocation,
  type LinkedInAccount,
  type MetaOAuthAccount,
} from "@/lib/api/connections";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowRight,
  Check,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  Unplug,
} from "lucide-react";

import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { UserAccountMenu } from "@/components/navigation/user-account-menu";
import { SocialLogo } from "@/components/ui/social-logo";

type PlatformDefinition = {
  name: string;
  description: string;
  oauthPlatform: string;
};

const PLATFORM_DEFINITIONS: PlatformDefinition[] = [
  {
    name: "Instagram",
    description:
      "Publish photos, reels, stories, and campaign content.",
    oauthPlatform: "meta",
  },
  {
    name: "Facebook",
    description:
      "Publish posts and manage your Facebook business presence.",
    oauthPlatform: "meta",
  },
  {
    name: "LinkedIn",
    description:
      "Publish professional content to your company page.",
    oauthPlatform: "linkedin",
  },
  {
    name: "Google Business",
    description:
      "Publish local updates, offers, and manage your Google Search & Maps profile.",
    oauthPlatform: "google_business",
  },
];

type MetaSelectionAccount = {
  platform: "facebook" | "instagram" | string;
  external_account_id: string;
  account_name: string;
  page_id?: string | null;
  page_name?: string | null;
  instagram_account_id?: string | null;
};

type MetaSelectionResponse = {
  success?: boolean;
  status?: string;
  transaction_id: string;
  tenant_id?: string;
  business_account_id?: number;
  platform?: string;
  accounts: MetaSelectionAccount[];
};

type MetaSelectionRequest = {
  transaction_id: string;
  platform: string;
  external_account_id: string;
};

export default function ConnectionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [channels, setChannels] = useState<BusinessChannel[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [connectingPlatform, setConnectingPlatform] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------
  // Meta OAuth account-selection state
  // -------------------------------------------------------

  const [metaAccounts, setMetaAccounts] = useState<
    MetaSelectionAccount[]
  >([]);

  const [metaTransactionId, setMetaTransactionId] =
    useState<string | null>(null);

  const [loadingMetaSelection, setLoadingMetaSelection] =
    useState(false);

  const [selectingMetaAccount, setSelectingMetaAccount] =
    useState<string | null>(null);

  const [metaSelectionOpen, setMetaSelectionOpen] =
    useState(false);

  // -------------------------------------------------------
  // Google Business OAuth location-selection state
  // -------------------------------------------------------

  const [
    googleBusinessLocations,
    setGoogleBusinessLocations,
  ] = useState<GoogleBusinessLocation[]>([]);

  const [
    googleBusinessTransactionId,
    setGoogleBusinessTransactionId,
  ] = useState<string | null>(null);

  const [
    loadingGoogleBusinessSelection,
    setLoadingGoogleBusinessSelection,
  ] = useState(false);

  const [
    selectingGoogleBusinessLocation,
    setSelectingGoogleBusinessLocation,
  ] = useState<string | null>(null);

  const [
    googleBusinessSelectionOpen,
    setGoogleBusinessSelectionOpen,
  ] = useState(false);

  // -------------------------------------------------------
  // LinkedIn OAuth account-selection state
  // -------------------------------------------------------

  const [linkedinAccounts, setLinkedinAccounts] = useState<LinkedInAccount[]>([]);
  const [linkedinTransactionId, setLinkedinTransactionId] = useState<string | null>(null);
  const [loadingLinkedInSelection, setLoadingLinkedInSelection] = useState(false);
  const [selectingLinkedInAccount, setSelectingLinkedInAccount] = useState<string | null>(null);
  const [linkedinSelectionOpen, setLinkedinSelectionOpen] = useState(false);

  const oauthHandledRef = useRef(false);

  // -------------------------------------------------------
  // Load connected channels
  // -------------------------------------------------------

  const loadChannels = async (
    showRefreshState = false,
  ) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await getBusinessChannels();

      setChannels(result.channels);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load connected platforms.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -------------------------------------------------------
  // Load Meta OAuth selection
  // -------------------------------------------------------

  const loadMetaSelection = async (
    transactionId: string,
  ) => {
    try {
      setLoadingMetaSelection(true);
      setError(null);

      const result = await getMetaOAuthSelection(
        transactionId,
      );

      if (
        !result.accounts ||
        result.accounts.length === 0
      ) {
        throw new Error(
          "No Facebook or Instagram accounts are available for this Meta connection.",
        );
      }

      setMetaTransactionId(
        result.transaction_id || transactionId,
      );

      setMetaAccounts(result.accounts);

      setMetaSelectionOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the Meta accounts available for connection.",
      );

      setMetaSelectionOpen(false);
    } finally {
      setLoadingMetaSelection(false);
    }
  };

  // -------------------------------------------------------
  // Load Google Business Profile location selection
  // -------------------------------------------------------

  const loadGoogleBusinessSelection = async (
    transactionId: string,
  ) => {
    try {
      setLoadingGoogleBusinessSelection(true);
      setError(null);

      const result =
        await getGoogleBusinessSelection(
          transactionId,
        );

      if (
        !result.locations ||
        result.locations.length === 0
      ) {
        throw new Error(
          "No Google Business Profile locations are available for this connection.",
        );
      }

      setGoogleBusinessTransactionId(
        result.transaction_id || transactionId,
      );

      setGoogleBusinessLocations(
        result.locations,
      );

      setGoogleBusinessSelectionOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your Google Business Profile locations.",
      );

      setGoogleBusinessSelectionOpen(false);
    } finally {
      setLoadingGoogleBusinessSelection(false);
    }
  };

  // -------------------------------------------------------
  // Load LinkedIn Profile / Company Page selection
  // -------------------------------------------------------

  const loadLinkedInSelection = async (
    transactionId: string,
  ) => {
    try {
      setLoadingLinkedInSelection(true);
      setError(null);

      const result = await getLinkedInSelection(transactionId);

      if (!result.accounts || result.accounts.length === 0) {
        throw new Error(
          "No LinkedIn profile or company pages are available for this connection.",
        );
      }

      setLinkedinTransactionId(
        result.transaction_id || transactionId,
      );

      setLinkedinAccounts(result.accounts);
      setLinkedinSelectionOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your LinkedIn account details.",
      );
      setLinkedinSelectionOpen(false);
    } finally {
      setLoadingLinkedInSelection(false);
    }
  };

  // -------------------------------------------------------
  // Read OAuth callback parameters
  //
  // IMPORTANT:
  // We only read the URL here.
  //
  // We DO NOT start OAuth again.
  // -------------------------------------------------------

  useEffect(() => {
    if (oauthHandledRef.current) {
      return;
    }

    oauthHandledRef.current = true;

    void loadChannels();

    const params = new URLSearchParams(
      window.location.search,
    );

    const oauth = params.get("oauth");

    const oauthStatus = params.get("status");

    const transactionId = params.get(
      "transaction_id",
    );

    // -----------------------------------------------------
    // Meta selection
    // -----------------------------------------------------

    if (
      oauth === "meta" &&
      oauthStatus === "selection_required" &&
      transactionId
    ) {
      void loadMetaSelection(transactionId);
    }

    // -----------------------------------------------------
    // Google Business selection
    // -----------------------------------------------------

    if (
      oauth === "google_business" &&
      oauthStatus === "selection_required" &&
      transactionId
    ) {
      void loadGoogleBusinessSelection(
        transactionId,
      );
    }

    // -----------------------------------------------------
    // LinkedIn selection
    // -----------------------------------------------------

    if (
      oauth === "linkedin" &&
      oauthStatus === "selection_required" &&
      transactionId
    ) {
      void loadLinkedInSelection(
        transactionId,
      );
    }

    // -----------------------------------------------------
    // Handle OAuth failure redirects
    // -----------------------------------------------------

    const oauthMessage = params.get("message");

    if (
      (oauth === "meta" ||
        oauth === "google_business" ||
        oauth === "linkedin") &&
      oauthStatus === "error" &&
      oauthMessage
    ) {
      setError(oauthMessage);
    }
  }, []);

  // -------------------------------------------------------
  // Connected channel calculations
  // -------------------------------------------------------

  const connectedChannels = useMemo(
    () =>
      channels.filter(
        (channel) =>
          channel.connected &&
          channel.status === "active" &&
          channel.is_enabled,
      ),
    [channels],
  );

  const connectedCount =
    connectedChannels.length;

  const getChannelForPlatform = (
    platformName: string,
  ): BusinessChannel | undefined => {
    return connectedChannels.find(
      (channel) =>
        channel.platform.toLowerCase() ===
        platformName.toLowerCase(),
    );
  };

  // -------------------------------------------------------
  // Start OAuth
  // -------------------------------------------------------

  const handleConnect = async (
    platform: PlatformDefinition,
  ) => {
    try {
      setConnectingPlatform(platform.name);

      setError(null);

      const result = await startPlatformOAuth(
        platform.oauthPlatform,
      );

      const authorizationUrl =
        result.authorization_url;

      if (!authorizationUrl) {
        throw new Error(
          "The platform connection could not be started.",
        );
      }

      /*
       * The backend handles the OAuth callback.
       *
       * Meta:
       *
       * Connections
       *      ↓
       * Meta OAuth
       *      ↓
       * Backend callback
       *      ↓
       * /connections?oauth=meta...
       *
       * Google Business:
       *
       * Connections
       *      ↓
       * Google OAuth
       *      ↓
       * Backend callback
       *      ↓
       * /connections?oauth=google_business...
       *
       * The callback is NOT handled by this function.
       */

      window.location.assign(
        authorizationUrl,
      );
    } catch (err) {
      setConnectingPlatform(null);

      setError(
        err instanceof Error
          ? err.message
          : `Failed to connect ${platform.name}.`,
      );
    }
  };

  // -------------------------------------------------------
  // Connect first available platform
  // -------------------------------------------------------

  const handleConnectFirstAvailable =
    async () => {
      const firstUnconnected =
        PLATFORM_DEFINITIONS.find(
          (platform) =>
            !getChannelForPlatform(
              platform.name,
            ),
        );

      if (!firstUnconnected) {
        return;
      }

      await handleConnect(
        firstUnconnected,
      );
    };

  // -------------------------------------------------------
  // Complete Meta account selection
  // -------------------------------------------------------

  const handleSelectMetaAccount = async (
    account: MetaSelectionAccount,
  ) => {
    if (!metaTransactionId) {
      setError(
        "The Meta OAuth transaction is missing. Please start the connection again.",
      );
      return;
    }

    try {
      setSelectingMetaAccount(
        account.external_account_id,
      );

      setError(null);

      const request: MetaSelectionRequest = {
        transaction_id: metaTransactionId,
        platform: account.platform,
        external_account_id:
          account.external_account_id,
      };

      await selectMetaOAuthAccount(request);

      // Connection has now been persisted
      // as a BusinessChannel.
      await loadChannels(true);

      // Close selection UI.
      setMetaSelectionOpen(false);

      setMetaAccounts([]);

      setMetaTransactionId(null);

      setSelectingMetaAccount(null);

      // Remove OAuth parameters from
      // browser history so refreshing the
      // page cannot repeat the selection flow.
      const cleanUrl =
        `${window.location.origin}${window.location.pathname}`;

      window.history.replaceState(
        {},
        "",
        cleanUrl,
      );
    } catch (err) {
      setSelectingMetaAccount(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect the selected Meta account.",
      );
    }
  };

  // -------------------------------------------------------
  // Close Meta selection
  // -------------------------------------------------------

  const handleCloseMetaSelection = () => {
    setMetaSelectionOpen(false);

    setMetaAccounts([]);

    setMetaTransactionId(null);

    const cleanUrl =
      `${window.location.origin}${window.location.pathname}`;

    window.history.replaceState(
      {},
      "",
      cleanUrl,
    );
  };

  // -------------------------------------------------------
  // Complete Google Business Profile location selection
  // -------------------------------------------------------

  const handleSelectGoogleBusinessLocation =
    async (
      location: GoogleBusinessLocation,
    ) => {
      if (!googleBusinessTransactionId) {
        setError(
          "The Google Business OAuth transaction is missing. Please start the connection again.",
        );
        return;
      }

      try {
        setSelectingGoogleBusinessLocation(
          location.name,
        );

        setError(null);

        await selectGoogleBusinessLocation({
          transaction_id:
            googleBusinessTransactionId,
          platform: "google_business",
          external_account_id:
            location.name,
        });

        // Connection has now been persisted
        // as a BusinessChannel.
        await loadChannels(true);

        setGoogleBusinessSelectionOpen(
          false,
        );

        setGoogleBusinessLocations([]);

        setGoogleBusinessTransactionId(null);

        setSelectingGoogleBusinessLocation(
          null,
        );

        // Remove OAuth parameters from
        // browser history so refreshing the
        // page cannot repeat the selection flow.
        const cleanUrl =
          `${window.location.origin}${window.location.pathname}`;

        window.history.replaceState(
          {},
          "",
          cleanUrl,
        );
      } catch (err) {
        setSelectingGoogleBusinessLocation(
          null,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect the selected Google Business Profile location.",
        );
      }
    };

  // -------------------------------------------------------
  // Close Google Business selection
  // -------------------------------------------------------

  const handleCloseGoogleBusinessSelection =
    () => {
      setGoogleBusinessSelectionOpen(false);

      setGoogleBusinessLocations([]);

      setGoogleBusinessTransactionId(null);

      const cleanUrl =
        `${window.location.origin}${window.location.pathname}`;

      window.history.replaceState(
        {},
        "",
        cleanUrl,
      );
    };

  // -------------------------------------------------------
  // Select LinkedIn account
  // -------------------------------------------------------

  const handleSelectLinkedInAccount = async (
    account: LinkedInAccount,
  ) => {
    if (!linkedinTransactionId) {
      setError(
        "The LinkedIn OAuth transaction is missing. Please start the connection again.",
      );
      return;
    }

    try {
      setSelectingLinkedInAccount(account.external_account_id);
      setError(null);

      await selectLinkedInAccount({
        transaction_id: linkedinTransactionId,
        platform: "linkedin",
        external_account_id: account.external_account_id,
      });

      // Connection has now been persisted
      // as a BusinessChannel.
      await loadChannels(true);

      setLinkedinSelectionOpen(false);
      setLinkedinAccounts([]);
      setLinkedinTransactionId(null);
      setSelectingLinkedInAccount(null);

      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, "", cleanUrl);
    } catch (err) {
      setSelectingLinkedInAccount(null);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect the selected LinkedIn account.",
      );
    }
  };

  // -------------------------------------------------------
  // Close LinkedIn selection
  // -------------------------------------------------------

  const handleCloseLinkedInSelection = () => {
    setLinkedinSelectionOpen(false);
    setLinkedinAccounts([]);
    setLinkedinTransactionId(null);

    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, "", cleanUrl);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <main className="min-h-screen md:pl-[230px]">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              <Menu size={19} />
            </button>

            <div className="flex items-center gap-2">
              <img
                src="/logo/app logo.png"
                alt="maeaco logo"
                className="h-7 w-7 rounded-lg object-contain"
              />

              <span className="text-base font-bold tracking-tight text-neutral-950">
                maeaco
              </span>
            </div>
          </div>

          <UserAccountMenu />
        </header>

        {/* Desktop Header */}
        <div className="hidden h-16 items-center justify-between border-b border-neutral-200 px-7 md:flex">
          <div>
            <p className="text-xs text-neutral-500">
              Workspace
            </p>

            <p className="text-sm font-medium">
              Your business workspace
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectedCount > 0
                    ? "bg-emerald-500"
                    : "bg-neutral-300"
                }`}
              />

              <span className="font-medium text-neutral-700">
                {connectedCount} of{" "}
                {PLATFORM_DEFINITIONS.length}{" "}
                platforms connected
              </span>
            </div>

            <UserAccountMenu />
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto w-full max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-1 text-sm text-neutral-500">
                Workspace
              </p>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Connections
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-neutral-500 sm:text-base">
                Connect your social platforms so maeaco can create, schedule, and
                publish content automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleConnectFirstAvailable()
              }
              disabled={
                loading ||
                connectingPlatform !== null ||
                loadingMetaSelection ||
                loadingGoogleBusinessSelection ||
                connectedCount ===
                  PLATFORM_DEFINITIONS.length
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connectingPlatform ||
              loadingMetaSelection ||
              loadingGoogleBusinessSelection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              Connect platform
            </button>
          </section>

          {/* Error */}
          {error && (
            <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Connection error
                  </p>

                  <p className="mt-1 text-sm leading-5 text-red-700">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadChannels(true)
                  }
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </button>
              </div>
            </section>
          )}

          {/* Connection status */}
          <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-neutral-950">
                    Your accounts are secure
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Connections use secure authorization.
                    Your passwords are never stored by maeaco.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connectedCount > 0
                      ? "bg-emerald-500"
                      : "bg-neutral-300"
                  }`}
                />

                <span className="font-medium text-neutral-700">
                  {connectedCount} of{" "}
                  {PLATFORM_DEFINITIONS.length}{" "}
                  platforms connected
                </span>
              </div>
            </div>
          </section>

          {/* Platform cards */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {PLATFORM_DEFINITIONS.map(
              (platform) => {
                const channel =
                  getChannelForPlatform(
                    platform.name,
                  );

                return (
                  <PlatformCard
                    key={platform.name}
                    platform={platform}
                    channel={channel}
                    loading={loading}
                    connecting={
                      connectingPlatform ===
                      platform.name
                    }
                    onConnect={() =>
                      void handleConnect(
                        platform,
                      )
                    }
                  />
                );
              },
            )}
          </section>

          {/* Autonomous publishing */}
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-950 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-neutral-950">
                    Autonomous publishing
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                    Once your platforms are connected,
                    the system can use your campaign
                    strategy to generate content, schedule
                    posts, and publish them according to your
                    campaign settings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  connectedCount === 0
                }
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Publishing settings
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* =====================================================
          Meta Account Selection Modal
          ===================================================== */}

      {metaSelectionOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="meta-selection-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <h2
                    id="meta-selection-title"
                    className="text-lg font-semibold text-neutral-950"
                  >
                    Select an account
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-neutral-500">
                    Meta found the following accounts.
                    Select the account you want to connect
                    to your business workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseMetaSelection
                  }
                  disabled={
                    selectingMetaAccount !==
                    null
                  }
                  aria-label="Close"
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
              {metaAccounts.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {metaAccounts.map(
                    (account) => {
                      const isInstagram =
                        account.platform.toLowerCase() ===
                        "instagram";

                      const isSelecting =
                        selectingMetaAccount ===
                        account.external_account_id;

                      return (
                        <button
                          key={`${account.platform}-${account.external_account_id}`}
                          type="button"
                          onClick={() =>
                            void handleSelectMetaAccount(
                              account,
                            )
                          }
                          disabled={
                            selectingMetaAccount !==
                            null
                          }
                          className="group flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                            {isInstagram ? (
                              <Instagram className="h-5 w-5" />
                            ) : (
                              <Facebook className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                              {isInstagram
                                ? "Instagram"
                                : "Facebook"}
                            </p>

                            <p className="mt-0.5 truncate text-sm font-semibold text-neutral-950">
                              {account.account_name}
                            </p>

                            <p className="mt-1 truncate text-xs text-neutral-500">
                              {
                                account.external_account_id
                              }
                            </p>
                          </div>

                          {isSelecting ? (
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-neutral-600" />
                          ) : (
                            <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-900" />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-6">
              <p className="text-xs leading-5 text-neutral-500">
                You can connect another Meta account later
                from this Connections page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Google Business Profile Location Selection Modal
          ===================================================== */}

      {googleBusinessSelectionOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-business-selection-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                    <Store className="h-5 w-5 text-neutral-900" />
                  </div>

                  <h2
                    id="google-business-selection-title"
                    className="text-lg font-semibold text-neutral-950"
                  >
                    Select your business location
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-neutral-500">
                    Google found the following Business Profile
                    locations. Select the location you want to
                    connect to your workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseGoogleBusinessSelection
                  }
                  disabled={
                    selectingGoogleBusinessLocation !==
                    null
                  }
                  aria-label="Close"
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
              {googleBusinessLocations.length ===
              0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {googleBusinessLocations.map(
                    (location) => {
                      const isSelecting =
                        selectingGoogleBusinessLocation ===
                        location.name;

                      const address =
                        location.storefront_address;

                      return (
                        <button
                          key={location.name}
                          type="button"
                          onClick={() =>
                            void handleSelectGoogleBusinessLocation(
                              location,
                            )
                          }
                          disabled={
                            selectingGoogleBusinessLocation !==
                            null
                          }
                          className="group flex w-full items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                            <Store className="h-5 w-5 text-neutral-800" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                              Google Business Profile
                            </p>

                            <p className="mt-0.5 truncate text-sm font-semibold text-neutral-950">
                              {location.title}
                            </p>

                            {address && (
                              <p className="mt-1 text-xs leading-5 text-neutral-500">
                                {formatGoogleAddress(
                                  address,
                                )}
                              </p>
                            )}

                            <p className="mt-1 truncate text-xs text-neutral-400">
                              {location.name}
                            </p>
                          </div>

                          {isSelecting ? (
                            <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-neutral-600" />
                          ) : (
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-900" />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-6">
              <p className="text-xs leading-5 text-neutral-500">
                You can connect another Google Business Profile
                later from this Connections page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LinkedIn Account Selection Modal
          ===================================================== */}

      {linkedinSelectionOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="linkedin-selection-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                    <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                  </div>

                  <h2
                    id="linkedin-selection-title"
                    className="text-lg font-semibold text-neutral-950"
                  >
                    Select your LinkedIn account
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-neutral-500">
                    LinkedIn found the following profile or company pages. Select the account you want to connect to your workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseLinkedInSelection}
                  disabled={selectingLinkedInAccount !== null}
                  aria-label="Close"
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
              {linkedinAccounts.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedinAccounts.map((account) => {
                    const isSelecting = selectingLinkedInAccount === account.external_account_id;
                    const isOrg = account.type === "organization";

                    return (
                      <button
                        key={`${account.type}-${account.external_account_id}`}
                        type="button"
                        onClick={() => void handleSelectLinkedInAccount(account)}
                        disabled={selectingLinkedInAccount !== null}
                        className="group flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white">
                          {account.picture ? (
                            <img
                              src={account.picture}
                              alt={account.account_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                            {isOrg ? "Company Page" : "Personal Profile"}
                          </p>

                          <p className="mt-0.5 truncate text-sm font-semibold text-neutral-950">
                            {account.account_name}
                          </p>

                          {account.email && (
                            <p className="mt-1 truncate text-xs text-neutral-500">
                              {account.email}
                            </p>
                          )}
                        </div>

                        {isSelecting ? (
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-neutral-600" />
                        ) : (
                          <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-900" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-6">
              <p className="text-xs leading-5 text-neutral-500">
                You can connect another LinkedIn channel or page later from this Connections page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformCard({
  platform,
  channel,
  loading,
  connecting,
  onConnect,
}: {
  platform: PlatformDefinition;
  channel?: BusinessChannel;
  loading: boolean;
  connecting: boolean;
  onConnect: () => void;
}) {
  const connected = Boolean(channel);

  return (
    <article className="card-3d card-3d-hover p-5 sm:p-6">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <SocialLogo platform={platform.name} className="h-12 w-12" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-900">
                {platform.name}
              </h2>

              {loading ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading
                </span>
              ) : connected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <span className="rounded-full border border-purple-200 bg-purple-50/60 px-2.5 py-0.5 text-xs text-purple-700 font-medium">
                  Not connected
                </span>
              )}
            </div>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              {platform.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={`More options for ${platform.name}`}
          className="shrink-0 rounded-lg p-2 transition hover:bg-purple-100/50"
        >
          <MoreHorizontal className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Connected account */}
      {connected && channel ? (
        <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-purple-600 font-medium">
                Connected account
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {channel.account_name}
              </p>

              {channel.external_account_id && (
                <p className="mt-1 truncate text-xs text-slate-500">
                  {channel.external_account_id}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-purple-50 shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 text-purple-600" />
                Refresh
              </button>

              <button
                type="button"
                disabled
                title="Disconnect will be enabled after the connection lifecycle is implemented."
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-400 disabled:cursor-not-allowed"
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <button
            type="button"
            onClick={onConnect}
            disabled={
              loading || connecting
            }
            className="btn-purple-gradient inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect {platform.name}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Capabilities */}
      {connected && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Capability label="Publishing" />
          <Capability label="Scheduling" />
          <Capability label="Analytics" />
        </div>
      )}
    </article>
  );
}

function Capability({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500">
      {label}
    </span>
  );
}

function getPlatformIcon(
  name: string,
) {
  switch (name) {
    case "Instagram":
      return Instagram;

    case "Facebook":
      return Facebook;

    case "LinkedIn":
      return Linkedin;

    case "Google Business":
      return Store;

    default:
      return ChevronRight;
  }
}

function formatGoogleAddress(
  address: Record<string, unknown>,
): string {
  const lines: string[] = [];

  const addressLines =
    address.addressLines;

  if (Array.isArray(addressLines)) {
    lines.push(
      ...addressLines.filter(
        (value): value is string =>
          typeof value === "string",
      ),
    );
  }

  const locality =
    typeof address.locality === "string"
      ? address.locality
      : null;

  const administrativeArea =
    typeof address.administrativeArea ===
    "string"
      ? address.administrativeArea
      : null;

  const postalCode =
    typeof address.postalCode === "string"
      ? address.postalCode
      : null;

  const region = [
    locality,
    administrativeArea,
    postalCode,
  ].filter(Boolean);

  if (region.length > 0) {
    lines.push(region.join(", "));
  }

  return lines.join(", ");
}