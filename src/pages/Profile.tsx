import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from "@/hooks/useAuth";
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  LogOut,
  Calendar,
  MapPin,
  Shield,
  Home,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import TwoFactorSetupModal from "@/components/TwoFactorSetupModal";
import TwoFactorDisableModal from "@/components/TwoFactorDisableModal";
import CampaignBadgeModal from "@/components/CampaignBadgeModal";
import CampaignDetailModal from "@/components/CampaignDetailModal";
import type { Campaign } from "@/types/campaign";

export default function Profile() {
  const { t, lang } = useLanguage();
  const { user, isAuthenticated, isLoading, logout } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const navigate = useNavigate();
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [badgeCampaignId, setBadgeCampaignId] = useState<number | null>(null);
  const [badgeCampaignTitle, setBadgeCampaignTitle] = useState("");
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const utils = trpc.useUtils();

  const { data: myRegistrations } = trpc.campaign.myRegistrations.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height: "64px",
          background: "rgba(var(--bg-surface-rgb, 30, 30, 30), 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--bg-surface-light)",
        }}
      >
        <div
          className="flex items-center justify-between h-full mx-auto"
          style={{ padding: "0 var(--page-margin)", maxWidth: "1400px" }}
        >
          <a
            href="/"
            className="font-display text-base tracking-tight no-underline"
            style={{ color: "var(--text-primary)" }}
          >
            GREEN
          </a>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer"
                style={{
                  color: "var(--accent-terracotta)",
                  background: "var(--bg-surface)",
                }}
              >
                <Shield size={14} />
                {t("nav.admin")}
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              title="Back to Home"
            >
              <Home size={16} />
            </button>
            <LanguageSwitcher />
            <button
              onClick={logout}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
              title={t("login.logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-16 px-4">
        <div className="mx-auto" style={{ maxWidth: "800px" }}>
          {/* Profile card */}
          <Card
            className="mb-8"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-surface-light)",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  className="w-16 h-16"
                  style={{ border: "2px solid var(--bg-surface-light)" }}
                />
                <div>
                  <h1
                    className="text-xl font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name ?? t("login.account")}
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {user.email}
                  </p>
                  <span
                    className="inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background:
                        user.role === "admin" || user.role === "super_admin"
                          ? "var(--accent-terracotta)"
                          : "var(--accent-green)",
                      color: "white",
                    }}
                  >
                    {user.role === "admin" || user.role === "super_admin"
                      ? t("login.role_admin")
                      : t("login.role_volunteer")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security / 2FA */}
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {t("two_factor.title")}
          </h2>
          <Card
            className="mb-8"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-surface-light)",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: user.twoFactorEnabled
                        ? "rgba(107, 142, 90, 0.15)"
                        : "var(--bg-surface-light)",
                      color: user.twoFactorEnabled
                        ? "var(--accent-green)"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {user.twoFactorEnabled ? (
                      <ShieldCheck size={20} />
                    ) : (
                      <ShieldOff size={20} />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.twoFactorEnabled
                        ? t("two_factor.enabled")
                        : t("two_factor.disabled")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    user.twoFactorEnabled
                      ? setDisableModalOpen(true)
                      : setSetupModalOpen(true)
                  }
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none"
                  style={{
                    background: user.twoFactorEnabled
                      ? "rgba(239, 68, 68, 0.1)"
                      : "var(--accent-green)",
                    color: user.twoFactorEnabled
                      ? "#ef4444"
                      : "var(--bg-primary)",
                  }}
                >
                  {user.twoFactorEnabled
                    ? t("two_factor.disable_button")
                    : t("two_factor.enable_button")}
                </button>
              </div>
            </CardContent>
          </Card>

          <TwoFactorSetupModal
            open={setupModalOpen}
            onClose={() => setSetupModalOpen(false)}
            onEnabled={() => utils.auth.me.invalidate()}
          />
          <TwoFactorDisableModal
            open={disableModalOpen}
            onClose={() => setDisableModalOpen(false)}
            onDisabled={() => utils.auth.me.invalidate()}
          />

          <CampaignBadgeModal
            campaignId={badgeCampaignId ?? 0}
            campaignTitle={badgeCampaignTitle}
            open={badgeCampaignId !== null}
            onClose={() => setBadgeCampaignId(null)}
          />

          {detailCampaign && (
            <CampaignDetailModal
              key={detailCampaign.id}
              campaign={detailCampaign}
              onClose={() => setDetailCampaign(null)}
            />
          )}

          {/* My Campaigns */}
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {t("profile.my_campaigns")}
          </h2>

          {myRegistrations &&
          myRegistrations.filter(r => r.campaign).length > 0 ? (
            <div className="space-y-3">
              {myRegistrations
                .filter(r => r.campaign)
                .map(reg => {
                  const campaign = reg.campaign!;
                  const campaignTitle =
                    (lang === "fr" && campaign.titleFr) ||
                    (lang === "ar" && campaign.titleAr) ||
                    campaign.titleEn;
                  const campaignLocation =
                    (lang === "fr" && campaign.locationFr) ||
                    (lang === "ar" && campaign.locationAr) ||
                    campaign.locationEn;
                  return (
                    <Card
                      key={reg.id}
                      className="transition-all duration-200 hover:shadow-lg active:scale-[0.99]"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--bg-surface-light)",
                        cursor: "pointer",
                      }}
                      onClick={() => setDetailCampaign(campaign)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-sm font-medium truncate md:text-base"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {campaignTitle}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span
                                className="flex items-center gap-1 text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                <Calendar size={12} />
                                {campaign.date}
                              </span>
                              <span
                                className="flex items-center gap-1 text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                <MapPin size={12} />
                                {campaignLocation}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setBadgeCampaignId(reg.campaignId);
                              setBadgeCampaignTitle(campaignTitle);
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer transition-colors"
                            style={{
                              background: "var(--accent-green)",
                              color: "var(--bg-primary)",
                            }}
                          >
                            {t("badge.show_badge")}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--bg-surface-light)",
              }}
            >
              <CardContent className="p-8 text-center">
                <Calendar
                  size={32}
                  className="mx-auto mb-3"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("profile.no_campaigns")}
                </p>
                <button
                  onClick={() => navigate("/#campaigns")}
                  className="mt-4 text-sm font-medium transition-colors duration-200 hover:text-[var(--accent-green-light)] bg-transparent border-none cursor-pointer"
                  style={{ color: "var(--accent-green)" }}
                >
                  {t("profile.browse_campaigns")}
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
