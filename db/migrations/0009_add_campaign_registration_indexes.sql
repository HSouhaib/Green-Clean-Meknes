-- Improve leaderboard and registration query performance
CREATE INDEX IF NOT EXISTS idx_campaign_registrations_user_id ON campaign_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_registrations_status ON campaign_registrations(status);
CREATE INDEX IF NOT EXISTS idx_campaign_registrations_guest ON campaign_registrations(guest_name, guest_email);
CREATE INDEX IF NOT EXISTS idx_volunteer_points_user_created ON volunteer_points(user_id, created_at);
