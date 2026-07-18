import { Card, CardContent } from "@/components/ui/card";
import { trpc } from '@/lib/trpc';
import { LoginPanel } from "@/components/LoginModal";
import { useLanguage } from '@/hooks/useLanguage';
import { useSearchParams, useNavigate } from "react-router";
import TwoFactorVerifyModal from "@/components/TwoFactorVerifyModal";

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const isAuthenticated = !!user;
  const pending2fa = searchParams.get("pending2fa") === "1";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "var(--bg-primary)",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, var(--bg-surface-light) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    >
      {pending2fa && !isAuthenticated && (
        <TwoFactorVerifyModal onVerified={() => navigate("/")} />
      )}
      {isAuthenticated ? (
        <Card
          className="w-full max-w-sm overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-surface-light)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <div className="h-1" style={{ background: "var(--accent-green)" }} />
          <CardContent className="p-6 text-center">
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name ?? t("login.account")}
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("login.signed_in_as")}{" "}
              <span
                className="font-medium"
                style={{
                  color:
                    user?.role === "admin"
                      ? "var(--accent-terracotta)"
                      : "var(--accent-green)",
                }}
              >
                {user?.role === "admin" || user?.role === "super_admin"
                  ? t("login.role_admin")
                  : t("login.role_volunteer")}
              </span>
              .
            </p>
            <div className="space-y-2.5">
              {(user?.role === "admin" || user?.role === "super_admin") && (
                <button
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: "var(--accent-terracotta)",
                    color: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => (window.location.href = "/admin")}
                >
                  {t("login.admin_dashboard")}
                </button>
              )}
              <LogoutButton />
              <button
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--bg-surface-light)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
                onClick={() => (window.location.href = "/")}
              >
                {t("login.back_home")}
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className="w-full max-w-sm overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-surface-light)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <div className="h-1" style={{ background: "var(--accent-green)" }} />
          <CardContent className="p-6">
            <LoginPanel />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LogoutButton() {
  const { t } = useLanguage();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <button
      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
      style={{
        background: "var(--bg-primary)",
        borderColor: "var(--bg-surface-light)",
        color: "var(--text-secondary)",
        cursor: "pointer",
      }}
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? t("login.logging_out") : t("login.logout")}
    </button>
  );
}
