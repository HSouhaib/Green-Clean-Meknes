import { volunteerRouter } from "./volunteer-router";
import { socialFeedRouter } from "./social-feed-router";
import { sponsorRouter } from "./sponsor-router";
import { campaignPhotoRouter } from "./campaign-photo-router";
import { faqRouter } from "./faq-router";
import { authRouter } from "./auth-router";
import { campaignRouter } from "./campaign-router";
import { contactRouter } from "./contact-router";
import { neighborhoodRouter } from "./neighborhood-router";
import { pollRouter } from "./poll-router";
import { sectionRouter } from "./section-router";
import { settingsRouter } from "./settings-router";
import { testimonialRouter } from "./testimonial-router";
import { userRouter } from "./user-router";
import { roleRouter } from "./role-router";
import { planRouter } from "./plan-router";
import { activityRouter } from "./activity-router";
import { badgeRouter } from "./badge-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  campaign: campaignRouter,
  campaignPhoto: campaignPhotoRouter,
  contact: contactRouter,
  faq: faqRouter,
  neighborhood: neighborhoodRouter,
  poll: pollRouter,
  section: sectionRouter,
  settings: settingsRouter,
  testimonial: testimonialRouter,
  user: userRouter,
  role: roleRouter,
  plan: planRouter,
  activity: activityRouter,
  volunteer: volunteerRouter,
  sponsor: sponsorRouter,
  socialFeed: socialFeedRouter,
  badge: badgeRouter,
});

export type AppRouter = typeof appRouter;
