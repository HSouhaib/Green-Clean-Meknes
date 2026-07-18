import { relations } from "drizzle-orm/relations";
import {
  users,
  campaigns,
  campaignRegistrations,
  volunteerPoints,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  campaignRegistrations: many(campaignRegistrations),
  volunteerPoints: many(volunteerPoints),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  campaignRegistrations: many(campaignRegistrations),
  volunteerPoints: many(volunteerPoints),
}));

export const campaignRegistrationsRelations = relations(
  campaignRegistrations,
  ({ one }) => ({
    user: one(users, {
      fields: [campaignRegistrations.userId],
      references: [users.id],
    }),
    campaign: one(campaigns, {
      fields: [campaignRegistrations.campaignId],
      references: [campaigns.id],
    }),
  })
);

export const volunteerPointsRelations = relations(volunteerPoints, ({ one }) => ({
  user: one(users, {
    fields: [volunteerPoints.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [volunteerPoints.campaignId],
    references: [campaigns.id],
  }),
  awardedByUser: one(users, {
    fields: [volunteerPoints.awardedBy],
    references: [users.id],
  }),
}));
