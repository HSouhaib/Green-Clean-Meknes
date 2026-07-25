import { relations } from "drizzle-orm/relations";
import {
  users,
  campaigns,
  neighborhoods,
  campaignRegistrations,
  volunteerPoints,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  campaignRegistrations: many(campaignRegistrations),
  volunteerPoints: many(volunteerPoints),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  neighborhood: one(neighborhoods, {
    fields: [campaigns.neighborhoodId],
    references: [neighborhoods.id],
  }),
  campaignRegistrations: many(campaignRegistrations),
  volunteerPoints: many(volunteerPoints),
}));

export const neighborhoodsRelations = relations(neighborhoods, ({ many }) => ({
  campaigns: many(campaigns),
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
