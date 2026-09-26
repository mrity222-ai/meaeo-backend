"use client";

import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsIdInitializeOptions = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
};

type GoogleAccountsIdRenderButtonOptions = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

type GoogleAccountsId = {
  initialize: (options: GoogleAccountsIdInitializeOptions) => void;
  renderButton: (
    parent: HTMLElement,
    options: GoogleAccountsIdRenderButtonOptions,
  ) => void;
};

type GoogleIdentityServices = {
  accounts: {
    id: GoogleAccountsId;
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

type GoogleSignInButtonProps = {
  onCredential?: (credential: string) => Promise<void> | void;
  onSuccess?: (credential: string) => Promise<void> | void;
  disabled?: boolean;
};

const GOOGLE_SCRIPT_ID = "google-identity-services-script";

export function GoogleSignInButton({
  onCredential,
  onSuccess,
  disabled = false,
}: GoogleSignInButtonProps) {
  const handler = onCredential || onSuccess || (() => {});
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(handler);
  const [scriptReady, setScriptReady] = useState(false);
  const [clientId, setClientId] = useState<string>(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  );

  useEffect(() => {
    callbackRef.current = handler;
  }, [handler]);

  // If clientId is not present in build-time env, fetch dynamically from backend
  useEffect(() => {
    if (clientId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    fetch(`${apiUrl}/auth/public-config`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.google_client_id) {
          setClientId(data.google_client_id);
        } else {
          console.warn("Google Client ID is not configured in Admin Settings.");
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve Google configuration:", err);
      });
  }, [clientId]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!clientId) {
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      if (window.google) {
        setScriptReady(true);
      } else {
        existingScript.addEventListener("load", () => setScriptReady(true), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setScriptReady(true);
    };

    script.onerror = () => {
      console.error("Unable to load Google Identity Services.");
    };

    document.head.appendChild(script);
  }, [clientId]);

  // Render Google button once script and clientId are ready
  useEffect(() => {
    if (!scriptReady || !window.google || !buttonRef.current || !clientId) {
      return;
    }

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response?.credential) {
          return;
        }
        void callbackRef.current(response.credential);
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 320,
    });
  }, [scriptReady, clientId]);

  return (
    <div
      className={
        disabled ? "pointer-events-none opacity-60" : "flex justify-center"
      }
    >
      <div ref={buttonRef} className="flex min-h-[44px] justify-center" />
    </div>
  );
}