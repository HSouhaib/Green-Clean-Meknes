import React, {
  useState,
  useCallback,
  useEffect,
} from "react";

import { LanguageContext, type Lang } from "@/contexts/language-context";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.leaderboard": "Leaderboard",
    "nav.campaigns": "Campaigns",
    "nav.contact": "Contact",

    "hero.heading": "Clean Meknes, One Campaign at a Time",
    "hero.subheading":
      "Join a community of citizens committed to cleaner streets, greener parks, and a healthier Meknes.",
    "hero.cta": "Join a Campaign",
    "hero.cta_unauth": "Join the Movement",

    "donation.label": "DONATE",
    "donation.title": "Support Our Mission",
    "donation.description":
      "Your contribution helps us organize more cleanups and spread awareness across Meknes.",
    "donation.bank_transfer": "Bank Transfer",
    "donation.copy": "Copy",
    "donation.paypal": "PayPal",
    "donation.paypal_cta": "Donate via PayPal",
    "donation.impact_title": "Where Your Donation Goes",
    "donation.impact_1":
      "Cleaning supplies (gloves, bags, tools) for {campaigns}+ campaigns per year",
    "donation.impact_2":
      "Refreshments and safety equipment for {volunteers}+ volunteers",
    "donation.impact_3":
      "Educational materials and awareness campaigns across {neighborhoods} neighborhoods",
    "donation.impact_4": "Tree planting and green space restoration projects",
    "donation.bank_name": "Bank Name",
    "donation.account_holder": "Account Holder",
    "donation.iban": "IBAN",
    "donation.swift": "SWIFT/BIC Code",

    "nav.login": "Log In",
    "nav.account": "Account",
    "nav.admin": "Admin",

    "theme.dark_mode": "Dark Mode",
    "theme.light_mode": "Light Mode",
    "theme.auto_mode": "Auto (Meknes)",

    "weather.clear_day": "Clear Sky",
    "weather.clear_night": "Clear Night",
    "weather.cloudy": "Cloudy",
    "weather.rain": "Rain",
    "weather.snow": "Snow",
    "weather.thunderstorm": "Thunderstorm",
    "weather.humidity": "Humidity",
    "weather.wind": "Wind",
    "weather.wind_kmh": "{speed} km/h",

    "impact.heading": "Our Impact",
    "impact.subheading": "Real numbers from real campaigns across Meknes.",
    "impact.campaigns": "Campaigns Completed",
    "impact.volunteers": "Volunteers Mobilized",
    "impact.waste": "kg Waste Collected",
    "impact.trees": "Trees Planted",
    "impact.neighborhoods": "Neighborhoods",

    "testimonials.heading": "What Volunteers Say",
    "testimonials.subheading":
      "Real stories from citizens making Meknes cleaner.",
    "testimonials.label": "TESTIMONIALS",
    "testimonials.empty": "No testimonials yet.",

    "community.label": "COMMUNITY",
    "community.heading": "Community Voices",
    "community.subheading":
      "Explore stories, partners, social updates, and more from our growing community.",

    "poll.label": "POLL",

    "contact.error.generic": "Something went wrong. Please try again.",
    "contact.error.invalid_email": "Please enter a valid email address.",
    "contact.error.invalid_chars": "Invalid characters detected.",

    "campaigns.filter.all": "All",
    "campaigns.filter.outdoor": "Outdoor",
    "campaigns.filter.community": "Community",
    "campaigns.filter.green": "Green",
    "campaigns.filter.trail": "Trail",
    "campaigns.filter.water": "Water",
    "campaigns.discover_title": "Discover Your Campaign",
    "campaigns.discover_body":
      "Draw a shape on this canvas to filter campaigns. Each shape highlights different campaign types.",
    "campaigns.instruction_fallback":
      "Draw a shape or tap a button to filter campaigns",

    "about.label": "ABOUT THE INITIATIVE",
    "about.heading": "A Movement Born from the Streets of Meknes",
    "about.body":
      "Green Clean Meknes is a citizen-led initiative that brings together individuals, neighborhoods, and local organizations to take direct action against litter and pollution in our city. Since 2023, we have organized over 40 cleanup campaigns across Meknes, mobilizing hundreds of volunteers and removing tons of waste from public spaces. Our mission is simple: a cleaner Meknes starts with each of us.",
    "about.stat1.number": "40+",
    "about.stat1.label": "Campaigns",
    "about.stat2.number": "800+",
    "about.stat2.label": "Volunteers",
    "about.stat3.number": "12",
    "about.stat3.label": "Neighborhoods",

    "join.label": "GET INVOLVED",
    "join.heading": "Three Ways to Make a Difference",
    "join.card1.title": "Join as a Volunteer",
    "join.card1.body":
      "Sign up for upcoming cleanup campaigns. We provide all the tools — gloves, bags, and refreshments. You bring the energy.",
    "join.card1.cta": "View Campaigns",
    "join.card2.title": "Spread the Word",
    "join.card2.body":
      "Share our campaigns on social media. Every share brings new volunteers and raises awareness about keeping Meknes clean.",
    "join.card2.cta": "Share Now",
    "join.card3.title": "Partner With Us",
    "join.card3.body":
      "Organizations, schools, and businesses can sponsor campaigns or organize corporate cleanup days. Let's collaborate.",
    "join.card3.cta": "Contact Us",

    "faq.label": "FAQ",
    "faq.empty": "No FAQs yet.",
    "faq.heading": "Frequently Asked Questions",
    "faq.subheading": "Everything you need to know before joining a campaign.",
    "faq.q1": "Do I need to bring anything?",
    "faq.a1":
      "We provide gloves, trash bags, and basic tools. Just bring water, comfortable clothes, and your enthusiasm!",
    "faq.q2": "Is there an age limit?",
    "faq.a2":
      "Volunteers of all ages are welcome! Children under 16 should be accompanied by an adult. We have tasks suitable for everyone.",
    "faq.q3": "How long do campaigns last?",
    "faq.a3":
      "Most campaigns last 2-4 hours, typically on weekend mornings. We always announce the exact duration when you register.",
    "faq.q4": "Can I organize a campaign in my neighborhood?",
    "faq.a4":
      "Absolutely! Contact us through the form below and we will help you plan and promote a cleanup in your area.",
    "faq.q5": "Is it safe to volunteer?",
    "faq.a5":
      "Yes, safety is our priority. We provide safety briefings, first aid kits, and never work in dangerous areas. All volunteers are covered by our insurance.",

    "campaigns.heading": "Upcoming Campaigns",
    "campaigns.subheading":
      "Click a filter or hover pins on the tactical map to find campaigns by theme.",
    "campaigns.canvas.placeholder": "Draw your commitment",
    "campaigns.canvas.instruction":
      "Draw a shape to discover your next campaign",
    "campaigns.register": "Register",
    "campaigns.registered": "Registered",
    "campaigns.registered_count": "registered",
    "campaigns.share": "Share",
    "campaigns.status.upcoming": "Upcoming",
    "campaigns.status.ongoing": "Ongoing",
    "campaigns.status.completed": "Completed",
    "campaigns.status.cancelled": "Cancelled",
    "campaigns.completed": "Completed",
    "campaigns.status_label": "Campaign status",
    "campaigns.impact_stats": "Impact stats",
    "campaigns.stats.waste": "kg waste",
    "campaigns.stats.trees": "trees",
    "campaigns.stats.volunteers": "volunteers",
    "campaigns.stats.neighborhoods": "neighborhoods",
    "campaigns.stats.waste_label": "Waste collected (kg)",
    "campaigns.stats.trees_label": "Trees planted",
    "campaigns.stats.volunteers_label": "Volunteers",
    "campaigns.stats.neighborhoods_label": "Neighborhoods",
    "campaigns.image_missing": "Image coming soon",

    "campaign.1.title": "Bab Mansour Plaza Cleanup",
    "campaign.1.location": "Bab Mansour, Old Medina",
    "campaign.1.description":
      "Join 50+ volunteers for a morning cleanup around the iconic Bab Mansour gate and surrounding plaza.",
    "campaign.2.title": "Ville Nouvelle Park Refresh",
    "campaign.2.location": "Avenue My Ismail, Ville Nouvelle",
    "campaign.2.description":
      "Help restore the beauty of Ville Nouvelle parks. Tree planting, litter collection, and bench repairs.",
    "campaign.3.title": "Hamria Market Deep Clean",
    "campaign.3.location": "Marche Hamria, Hamria",
    "campaign.3.description":
      "A thorough cleanup of the Hamria market area. Focus on waste sorting and recycling education.",
    "campaign.4.title": "Borj Belkari Trail Clean",
    "campaign.4.location": "Borj Belkari, Route de Fes",
    "campaign.4.description":
      "Outdoor trail cleanup along the scenic Borj Belkari route. Great for nature lovers and hikers.",

    "contact.label": "CONTACT",
    "contact.heading": "Get in Touch",
    "contact.body":
      "Have questions about volunteering, partnerships, or organizing a cleanup in your neighborhood? Reach out — we reply within 24 hours.",
    "contact.name.placeholder": "Your name",
    "contact.email.placeholder": "your@email.com",
    "contact.message.placeholder": "How can we help?",
    "contact.submit": "Send Message",
    "contact.sending": "Sending...",
    "contact.success": "Message sent! We'll be in touch soon.",
    "contact.form_title": "Get in Touch",
    "contact.form_subtitle":
      "Fill out the form below and we will get back to you.",
    "contact.send_another": "Send Another Message",

    "footer.tagline": "Cleaner Streets. Greener Parks. Stronger Community.",
    "footer.copyright": "2025 Green Clean Meknes. All rights reserved.",
    "social.whatsapp": "WhatsApp",
    "social.instagram": "Instagram",
    "social.facebook": "Facebook",
    "footer.lang.en": "English",
    "footer.lang.fr": "Francais",
    "footer.lang.ar": "Arabic",

    "login.welcome": "Welcome",
    "login.subtitle": "Sign in to join the movement",
    "login.coming_soon": "Coming Soon",
    "gallery.label": "GALLERY",
    "gallery.empty": "No gallery photos yet.",
    "socialFeed.label": "SOCIAL FEED",
    "socialFeed.empty": "No social posts yet.",
    "socialFeed.heading": "Latest on Social Media",
    "socialFeed.subheading":
      "Follow our journey and see what our community is sharing across platforms.",
    "sponsors.label": "PARTNERS",
    "partners.empty": "No partners yet.",
    "sponsors.heading": "Our Partners & Sponsors",
    "sponsors.subheading":
      "Organizations and businesses supporting our mission for a cleaner Meknes.",
    "gallery.heading": "Before & After",
    "gallery.subheading":
      "See the real impact our volunteers make across Meknes.",
    "gallery.before": "Before",
    "gallery.after": "After",

    "login.account": "Account",
    "login.signed_in_as": "You are signed in as",
    "login.role_admin": "an admin",
    "login.role_volunteer": "a volunteer",
    "login.admin_dashboard": "Go to Admin Dashboard",
    "login.back_home": "Back to Home",
    "login.logout": "Logout",
    "login.logging_out": "Logging out...",
    "login.title": "Welcome",
    "login.or": "or",
    "login.terms":
      "By signing in, you agree to our Terms of Service and Privacy Policy.",

    "volunteer.form_title": "Become a Volunteer",
    "volunteer.form_subtitle":
      "Fill out the form below and an admin will review your application.",
    "volunteer.name": "Full Name",
    "volunteer.email": "Email Address",
    "volunteer.phone": "Phone Number (optional)",
    "volunteer.message": "Why do you want to join? (optional)",
    "volunteer.submit": "Submit Application",
    "volunteer.submitting": "Submitting...",
    "volunteer.success":
      "Application submitted successfully! An admin will review it soon.",
    "volunteer.register_another": "Register another volunteer",
    "volunteer.success_subtitle":
      "We will review your application and contact you soon.",
    "volunteer.no_account_note":
      "No account required. An admin will review your application.",

    "guest_register.title": "Join Campaign",
    "guest_register.success_title": "Registration Complete",
    "guest_register.description":
      "Enter your details to register for this campaign. No account required.",
    "guest_register.name_placeholder": "Full Name",
    "guest_register.email_placeholder": "Email Address",
    "guest_register.registering": "Registering...",
    "guest_register.submit": "Register for Campaign",
    "guest_register.success_message": "You are registered!",
    "guest_register.success_detail": "We will send details to {email}",
    "guest_register.done": "Done",
    "guest_register.toast_success": "Registered successfully!",

    "profile.my_campaigns": "My Campaigns",
    "profile.no_campaigns": "You have not registered for any campaigns yet.",
    "profile.browse_campaigns": "Browse Campaigns",

    "maintenance.title": "Under Maintenance",
    "maintenance.default_message":
      "We are currently performing security updates and improvements. Please check back soon.",
    "maintenance.refresh": "Refresh",
    "maintenance.admin_dashboard": "Admin Dashboard",

    "two_factor.title": "Two-Factor Authentication",
    "two_factor.enabled":
      "Two-factor authentication is enabled for your account.",
    "two_factor.disabled": "Two-factor authentication is not enabled.",
    "two_factor.enable_button": "Enable 2FA",
    "two_factor.disable_button": "Disable 2FA",
    "two_factor.setup_title": "Set Up Two-Factor Authentication",
    "two_factor.setup_instruction":
      "Scan the QR code with your authenticator app, then enter the 6-digit code below.",
    "two_factor.secret_fallback": "Cannot scan? Enter this secret manually:",
    "two_factor.verification_code": "Verification code",
    "two_factor.backup_codes_title": "Backup codes",
    "two_factor.backup_codes_instruction":
      "Save these codes in a secure place. Each code can be used once if you lose access to your authenticator app.",
    "two_factor.verify_title": "Verify Two-Factor Authentication",
    "two_factor.verify_instruction":
      "Enter the 6-digit code from your authenticator app to continue.",
    "two_factor.use_backup_code": "Use a backup code",
    "two_factor.use_totp_code": "Use authenticator code",
    "two_factor.backup_code": "Backup code",
    "two_factor.submit": "Verify",
    "two_factor.cancel": "Cancel",
    "two_factor.close": "Close",
    "two_factor.error_invalid_code":
      "Invalid verification code. Please try again.",
    "two_factor.error_setup_failed":
      "Failed to set up two-factor authentication.",
    "two_factor.error_disable_failed":
      "Failed to disable two-factor authentication.",
    "two_factor.error_verify_failed":
      "Failed to verify two-factor authentication.",
    "two_factor.success_enabled":
      "Two-factor authentication enabled successfully.",
    "two_factor.success_disabled":
      "Two-factor authentication disabled successfully.",
    "two_factor.success_verified": "Two-factor authentication verified.",

    "login.provider.kimi": "Sign in with Kimi",
    "login.provider.google": "Sign in with Google",
    "login.provider.facebook": "Sign in with Facebook",
    "login.provider.tiktok": "Sign in with TikTok",
    "login.provider.x": "Sign in with X",
    "login.provider.microsoft": "Sign in with Microsoft",

    "air_quality.heading": "Meknes Air Quality",
    "air_quality.subheading":
      "Live air quality data for Meknes. Updated hourly from Open-Meteo.",
    "air_quality.aqi_good": "Air quality is good. Enjoy outdoor activities!",
    "air_quality.aqi_moderate":
      "Air quality is moderate. Sensitive individuals should limit prolonged outdoor exertion.",
    "air_quality.aqi_sensitive":
      "Air quality is unhealthy for sensitive groups. Consider wearing a mask outdoors.",
    "air_quality.aqi_unhealthy":
      "Air quality is unhealthy. Avoid prolonged outdoor activities and wear a mask.",
    "air_quality.advice_good": "Air quality is good. Enjoy outdoor activities!",
    "air_quality.advice_moderate":
      "Air quality is moderate. Sensitive individuals should limit prolonged outdoor exertion.",
    "air_quality.advice_sensitive":
      "Air quality is unhealthy for sensitive groups. Consider wearing a mask outdoors.",
    "air_quality.advice_unhealthy":
      "Air quality is unhealthy. Avoid prolonged outdoor activities and wear a mask.",
    "air_quality.level_good": "Good",
    "air_quality.level_moderate": "Moderate",
    "air_quality.level_sensitive": "Unhealthy for Sensitive Groups",
    "air_quality.level_unhealthy": "Unhealthy",
    "air_quality.level_very_unhealthy": "Very Unhealthy",
    "air_quality.level_hazardous": "Hazardous",
    "air_quality.pm25_desc":
      "Fine particles that can penetrate deep into lungs",
    "air_quality.pm10_desc": "Coarse particles from dust and pollen",
    "air_quality.no2_desc": "Nitrogen dioxide from traffic and industry",
    "air_quality.o3_desc": "Ground-level ozone, a respiratory irritant",
    "air_quality.simulated": "Simulated data (API unavailable)",
    "air_quality.updated": "Updated",
    "air_quality.location": "Location",
    "air_quality.show_guide": "How to Read This Data",
    "air_quality.hide_guide": "Hide Guide",
    "air_quality.scale_title": "AQI Scale",
    "air_quality.scale_desc":
      "The Air Quality Index (AQI) runs from 0 to 500. The higher the value, the greater the level of air pollution and health concern.",
    "air_quality.how_title": "Understanding Air Quality",
    "air_quality.what_is_aqi": "What is AQI?",
    "air_quality.what_is_aqi_desc":
      "The Air Quality Index (AQI) is a standardized scale used worldwide to communicate how polluted the air currently is or how polluted it is forecast to become. It converts complex pollutant measurements into a single easy-to-understand number.",
    "air_quality.how_measured": "How is it measured?",
    "air_quality.how_measured_desc":
      "Air quality stations measure concentrations of key pollutants in the atmosphere — PM2.5, PM10, NO₂, SO₂, CO, and O₃. These measurements are fed into a formula that calculates a single AQI value. The pollutant with the highest individual index determines the overall AQI.",
    "air_quality.pollutants_title": "What are these pollutants?",
    "air_quality.pollutants_desc":
      "PM2.5 and PM10 are tiny solid or liquid particles suspended in air. NO₂ comes mainly from vehicle exhaust and industrial emissions. SO₂ is produced by burning fossil fuels. CO is a colorless gas from incomplete combustion. O₃ (ozone) forms when sunlight reacts with other pollutants.",
    "air_quality.data_source": "Where does this data come from?",
    "air_quality.data_source_desc":
      "This data is sourced from Open-Meteo, a global weather and air quality API that aggregates data from national monitoring stations and satellite observations. When live data is unavailable, we display realistic simulated values based on typical Meknes conditions.",

    "poll.heading": "Community Poll",
    "poll.subheading": "Have your say on what matters most for Meknes.",
    "poll.question": "What area of Meknes needs cleaning most?",
    "poll.vote": "Vote",
    "poll.results": "Results",
    "poll.thanks": "Thank you for voting!",
    "poll.votes": "votes",
    "poll.no_active": "No active poll at the moment.",
    "poll.option_1": "Old Medina",
    "poll.option_2": "Place el-Hedim",
    "poll.option_3": "Fert River Banks",
    "poll.option_4": "Residential Neighborhoods",
    "poll.option_5": "Public Parks",

    "error.modal.title": "Something Went Wrong",
    "error.modal.retry": "Try Again",
    "error.modal.dismiss": "Dismiss",
    "error.modal.close": "Close",
    "error.modal.network":
      "Network error. Please check your connection and try again.",
    "error.modal.auth": "Authentication failed. Please log in again.",
    "error.modal.generic": "Something went wrong. Please try again.",
    "error.modal.oauth_denied":
      "Login was cancelled. You can try again whenever you are ready.",
    "error.modal.oauth_failed":
      "Login failed. Please try again or use a different method.",
    "error.modal.rate_limit":
      "Too many attempts. Please wait a moment and try again.",
    "error.modal.csrf": "Security validation failed. Please try again.",
    "error.modal.pkce": "Login session expired. Please try again.",
    "error.modal.redirect":
      "Invalid redirect. Please try again from the home page.",
    "error.modal.permission":
      "You do not have permission to perform this action.",
    "error.modal.not_found": "The requested resource was not found.",
    "error.modal.server": "Server error. Please try again later.",
    "error.modal.offline":
      "You appear to be offline. Please check your connection.",
    "error.modal.unauthorized":
      "You need to be logged in to perform this action.",

    "toast.success": "Success",
    "toast.error": "Error",
    "toast.saved": "Saved successfully",
    "toast.created": "Created successfully",
    "toast.updated": "Updated successfully",
    "toast.deleted": "Deleted successfully",
    "toast.vote_cast": "Vote recorded",
    "toast.vote_already": "You have already voted",
    "toast.settings_saved": "Settings saved",
    "toast.campaign_created": "Campaign created",
    "toast.campaign_updated": "Campaign updated",
    "toast.campaign_deleted": "Campaign deleted",
    "toast.testimonial_created": "Testimonial created",
    "toast.testimonial_updated": "Testimonial updated",
    "toast.testimonial_deleted": "Testimonial deleted",
    "toast.poll_created": "Poll created",
    "toast.poll_updated": "Poll updated",
    "toast.poll_deleted": "Poll deleted",
    "toast.faq_created": "FAQ created",
    "toast.faq_updated": "FAQ updated",
    "toast.faq_deleted": "FAQ deleted",
    "toast.photo_created": "Photo added",
    "toast.photo_updated": "Photo updated",
    "toast.photo_deleted": "Photo deleted",
    "toast.socialFeed_created": "Social post added",
    "toast.socialFeed_updated": "Social post updated",
    "toast.socialFeed_deleted": "Social post deleted",
    "toast.sponsor_created": "Sponsor added",
    "toast.sponsor_updated": "Sponsor updated",
    "toast.sponsor_deleted": "Sponsor deleted",
    "toast.status_updated": "Status updated",
    "toast.visibility_toggled": "Visibility updated",
    "toast.volunteer_updated": "Volunteer status updated",
    "toast.volunteer_deleted": "Volunteer deleted",
    "toast.error_generic": "Something went wrong. Please try again.",
    "toast.error_auth": "Authentication failed. Please log in again.",
    "toast.error_network": "Network error. Please check your connection.",

    "countdown.next_campaign": "Next Campaign",
    "countdown.days": "Days",
    "countdown.hours": "Hours",
    "countdown.minutes": "Minutes",
    "countdown.seconds": "Seconds",
    "countdown.started": "Campaign Started!",

    "neighborhoods.label": "NEIGHBORHOODS",
    "neighborhoods.heading": "Our Neighborhoods",
    "neighborhoods.subheading":
      "Discover the communities we serve across Meknes.",
    "neighborhoods.loading": "Loading neighborhoods...",
    "neighborhoods.not_found": "Neighborhood Not Found",
    "neighborhoods.not_found_desc":
      "The neighborhood you are looking for does not exist.",
    "neighborhoods.back_home": "Back to Home",
    "neighborhoods.location": "Meknes, Morocco",
    "neighborhoods.stats": "Impact Stats",
    "share.text": "Join the {title} cleanup in Meknes on {date}! {description}",
    "toast.copied": "Copied! Paste to share",

    "badge.title": "Campaign Badge",
    "badge.loading": "Loading your badge...",
    "badge.qr_alt": "Campaign badge QR code",
    "badge.copy": "Copy",
    "badge.copied": "Copied",
    "badge.copy_failed": "Could not copy",
    "badge.hint": "Show this QR code to a coordinator to check in.",
    "badge.attended": "Attended",
    "badge.not_attended": "Not attended",
    "badge.show_badge": "Show badge",
    "badge.verify_title": "Verify Badge",
    "badge.verify_placeholder": "Paste the badge token here...",
    "badge.verify": "Verify badge",
    "badge.verifying": "Verifying...",
    "badge.verified": "Verified",
    "badge.already_attended": "Already attended",
    "badge.unknown_user": "Unknown user",
    "badge.campaign": "Campaign",
    "badge.role_label": "Role",
    "badge.presence_title": "Presence Check",
    "badge.scan_badge": "Scan badge",
    "badge.select_campaign": "Select a campaign",
    "badge.select_campaign_prompt": "Select a campaign to view registrations.",
    "badge.search_placeholder": "Search volunteers...",
    "badge.registered": "Registered",
    "badge.present": "Present",
    "badge.volunteer": "Volunteer",
    "badge.status": "Status",
    "badge.mark_present": "Mark present",
    "badge.mark_absent": "Mark absent",
    "badge.attendance_updated": "Attendance updated",
    "badge.attendance_update_failed": "Failed to update attendance",
    "badge.no_registrations": "No registrations yet.",
    "badge.paste_token": "Paste token",
    "badge.scan_with_camera": "Scan with camera",
    "badge.camera_loading": "Starting camera...",
    "badge.camera_not_found": "No camera found",

    "leaderboard.heading": "Top Volunteers",
    "leaderboard.subheading": "Celebrating the people making Meknes cleaner, one campaign at a time.",
    "leaderboard.rank": "Rank",
    "leaderboard.points": "points",
    "leaderboard.participants": "participants",
    "leaderboard.campaigns_attended": "campaigns attended",
    "leaderboard.view_all": "View full leaderboard",
    "leaderboard.empty": "No volunteers on the leaderboard yet.",
    "leaderboard.loading": "Loading leaderboard...",
    "leaderboard.period.all": "All time",
    "leaderboard.period.year": "This year",
    "leaderboard.period.month": "This month",
    "leaderboard.search_placeholder": "Search volunteers...",
    "leaderboard.no_search_results": "No volunteers match your search.",
    "leaderboard.guest": "Guest",

    "admin.leaderboard.title": "Leaderboard",
    "admin.leaderboard.award_points": "Award points",
    "admin.leaderboard.select_user": "Select a volunteer",
    "admin.leaderboard.points": "Points",
    "admin.leaderboard.reason": "Reason",
    "admin.leaderboard.award": "Award",
    "admin.leaderboard.search": "Search leaderboard...",
    "admin.leaderboard.points_system": "Points system",
    "admin.leaderboard.points_system_help": "Set how many points volunteers earn automatically when they register for a campaign, when their attendance is confirmed, and for every kilogram of waste they personally collect. Waste is split equally among all attendees of each campaign.",
    "admin.leaderboard.points_registration": "Points per registration",
    "admin.leaderboard.points_attendance": "Points per attendance",
    "admin.leaderboard.points_per_waste_kg": "Points per waste kg",
    "admin.leaderboard.save_points": "Save point values",
    "admin.leaderboard.saving": "Saving...",
    "admin.leaderboard.invalid_points": "Point values must be non-negative numbers.",

    "toast.points_awarded": "Points awarded",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.about": "A propos",
    "nav.leaderboard": "Classement",
    "nav.campaigns": "Campagnes",
    "nav.contact": "Contact",

    "hero.heading": "Meknes Propre, Une Campagne a la Fois",
    "hero.subheading":
      "Rejoignez une communaute de citoyens engages pour des rues plus propres, des parcs plus verts et un Meknes plus sain.",
    "hero.cta": "Rejoindre une Campagne",
    "hero.cta_unauth": "Rejoignez le Mouvement",

    "about.label": "A PROPOS DE L'INITIATIVE",
    "about.heading": "Un Mouvement Ne dans les Rues de Meknes",
    "about.body":
      "Green Clean Meknes est une initiative citoyenne qui rassemble des individus, des quartiers et des organisations locales pour agir directement contre les dechets et la pollution dans notre ville. Depuis 2023, nous avons organise plus de 40 campagnes de nettoyage a travers Meknes, mobilisant des centaines de benevoles et retirant des tonnes de dechets des espaces publics. Notre mission est simple : un Meknes plus propre commence par chacun de nous.",
    "about.stat1.number": "40+",
    "about.stat1.label": "Campagnes",
    "about.stat2.number": "800+",
    "about.stat2.label": "Benevoles",
    "about.stat3.number": "12",
    "about.stat3.label": "Quartiers",

    "join.label": "S'IMPLIQUER",
    "join.heading": "Trois Facons de Faire la Difference",
    "join.card1.title": "Devenir Benevole",
    "join.card1.body":
      "Inscrivez-vous aux prochaines campagnes de nettoyage. Nous fournissons tout le materiel — gants, sacs et rafraichissements. Vous apportez l'energie.",
    "join.card1.cta": "Voir les Campagnes",
    "join.card2.title": "Passer le Mot",
    "join.card2.body":
      "Partagez nos campagnes sur les reseaux sociaux. Chaque partage attire de nouveaux benevoles et sensibilise a la propreté de Meknes.",
    "join.card2.cta": "Partager",
    "join.card3.title": "Devenir Partenaire",
    "join.card3.body":
      "Les organisations, ecoles et entreprises peuvent sponsoriser des campagnes ou organiser des journees de nettoyage. Collaborons.",
    "join.card3.cta": "Nous Contacter",

    "faq.label": "FAQ",
    "faq.empty": "Aucune FAQ pour le moment.",
    "faq.heading": "Questions Fréquentes",
    "faq.subheading":
      "Tout ce que vous devez savoir avant de rejoindre une campagne.",
    "faq.q1": "Dois-je apporter quelque chose ?",
    "faq.a1":
      "Nous fournissons des gants, des sacs poubelles et des outils de base. Apportez juste de l'eau, des vêtements confortables et votre enthousiasme !",
    "faq.q2": "Y a-t-il une limite d'âge ?",
    "faq.a2":
      "Les bénévoles de tous âges sont les bienvenus ! Les enfants de moins de 16 ans doivent être accompagnés d'un adulte. Nous avons des tâches adaptées à tout le monde.",
    "faq.q3": "Combien de temps durent les campagnes ?",
    "faq.a3":
      "La plupart des campagnes durent 2 à 4 heures, généralement le matin en week-end. Nous annonçons toujours la durée exacte lors de votre inscription.",
    "faq.q4": "Puis-je organiser une campagne dans mon quartier ?",
    "faq.a4":
      "Absolument ! Contactez-nous via le formulaire ci-dessous et nous vous aiderons à planifier et promouvoir un nettoyage dans votre quartier.",
    "faq.q5": "Est-il sûr de faire du bénévolat ?",
    "faq.a5":
      "Oui, la sécurité est notre priorité. Nous fournissons des briefings de sécurité, des trousses de premiers secours et ne travaillons jamais dans des zones dangereuses. Tous les bénévoles sont couverts par notre assurance.",

    "donation.label": "FAIRE UN DON",
    "donation.title": "Soutenez Notre Mission",
    "donation.description":
      "Votre contribution nous aide a organiser plus de nettoyages et a sensibiliser les gens a travers Meknes.",
    "donation.bank_transfer": "Virement Bancaire",
    "donation.copy": "Copier",
    "donation.paypal": "PayPal",
    "donation.paypal_cta": "Faire un don via PayPal",
    "donation.impact_title": "Ou Va Votre Don",
    "donation.impact_1":
      "Fournitures de nettoyage (gants, sacs, outils) pour {campaigns}+ campagnes par an",
    "donation.impact_2":
      "Rafraichissements et equipement de securite pour {volunteers}+ benevoles",
    "donation.impact_3":
      "Materiel educatif et campagnes de sensibilisation dans {neighborhoods} quartiers",
    "donation.impact_4":
      "Projets de plantation d arbres et de restauration des espaces verts",
    "donation.bank_name": "Nom de la Banque",
    "donation.account_holder": "Titulaire du Compte",
    "donation.iban": "IBAN",
    "donation.swift": "Code SWIFT/BIC",

    "nav.login": "Connexion",
    "nav.account": "Compte",
    "nav.admin": "Admin",

    "theme.dark_mode": "Mode Sombre",
    "theme.light_mode": "Mode Clair",
    "theme.auto_mode": "Auto (Meknès)",

    "weather.clear_day": "Ciel Clair",
    "weather.clear_night": "Nuit Claire",
    "weather.cloudy": "Nuageux",
    "weather.rain": "Pluie",
    "weather.snow": "Neige",
    "weather.thunderstorm": "Orage",
    "weather.humidity": "Humidité",
    "weather.wind": "Vent",
    "weather.wind_kmh": "{speed} km/h",

    "impact.heading": "Notre Impact",
    "impact.subheading":
      "Des chiffres réels de vraies campagnes à travers Meknès.",
    "impact.campaigns": "Campagnes Réalisées",
    "impact.volunteers": "Bénévoles Mobilises",
    "impact.waste": "kg de Dechets Collectes",
    "impact.trees": "Arbres Plantes",
    "impact.neighborhoods": "Quartiers",

    "testimonials.heading": "Ce Que Disent les Bénévoles",
    "testimonials.subheading":
      "Des histoires réelles de citoyens qui rendent Meknès plus propre.",
    "testimonials.label": "TÉMOIGNAGES",
    "testimonials.empty": "Aucun témoignage pour le moment.",

    "community.label": "COMMUNAUTÉ",
    "community.heading": "Voix de la Communauté",
    "community.subheading":
      "Découvrez les histoires, les partenaires, les actualités sociales et plus encore de notre communauté en pleine croissance.",

    "poll.label": "SONDAGE",

    "contact.error.generic": "Une erreur s'est produite. Veuillez reessayer.",
    "contact.error.invalid_email": "Veuillez entrer une adresse email valide.",
    "contact.error.invalid_chars": "Caracteres invalides detectes.",

    "campaigns.filter.all": "Tous",
    "campaigns.filter.outdoor": "Exterieur",
    "campaigns.filter.community": "Communautaire",
    "campaigns.filter.green": "Vert",
    "campaigns.filter.trail": "Sentier",
    "campaigns.filter.water": "Eau",
    "campaigns.discover_title": "Decouvrez Votre Campagne",
    "campaigns.discover_body":
      "Dessinez une forme sur ce canvas pour filtrer les campagnes. Chaque forme met en valeur differents types de campagnes.",
    "campaigns.instruction_fallback":
      "Dessinez une forme ou appuyez sur un bouton pour filtrer les campagnes",
    "campaigns.heading": "Campagnes a Venir",
    "campaigns.subheading":
      "Cliquez sur un filtre ou survolez les points sur la carte tactique pour trouver des campagnes par theme.",
    "campaigns.canvas.placeholder": "Dessinez votre engagement",
    "campaigns.canvas.instruction":
      "Dessinez une forme pour decouvrir votre prochaine campagne",
    "campaigns.share": "Partager",
    "campaigns.register": "S'inscrire",
    "campaigns.registered": "Inscrit",
    "campaigns.registered_count": "inscrits",
    "campaigns.status.upcoming": "A venir",
    "campaigns.status.ongoing": "En cours",
    "campaigns.status.completed": "Terminee",
    "campaigns.status.cancelled": "Annulee",
    "campaigns.completed": "Terminee",
    "campaigns.status_label": "Statut de la campagne",
    "campaigns.impact_stats": "Statistiques d impact",
    "campaigns.stats.waste": "kg de dechets",
    "campaigns.stats.trees": "arbres",
    "campaigns.stats.volunteers": "benevoles",
    "campaigns.stats.neighborhoods": "quartiers",
    "campaigns.stats.waste_label": "Dechets collectes (kg)",
    "campaigns.stats.trees_label": "Arbres plantes",
    "campaigns.stats.volunteers_label": "Benevoles",
    "campaigns.stats.neighborhoods_label": "Quartiers",
    "campaigns.image_missing": "Image bientot disponible",

    "campaign.1.title": "Nettoyage Place Bab Mansour",
    "campaign.1.location": "Bab Mansour, Vieille Medina",
    "campaign.1.description":
      "Rejoignez plus de 50 benevoles pour un nettoyage matinal autour de la celebre porte Bab Mansour et de la place environnante.",
    "campaign.2.title": "Rafraichissement Parc Ville Nouvelle",
    "campaign.2.location": "Avenue My Ismail, Ville Nouvelle",
    "campaign.2.description":
      "Aidez a restaurer la beaute des parcs de Ville Nouvelle. Plantation d'arbres, collecte de dechets et reparation de bancs.",
    "campaign.3.title": "Nettoyage en Profondeur Marche Hamria",
    "campaign.3.location": "Marche Hamria, Hamria",
    "campaign.3.description":
      "Un nettoyage approfondi de la zone du marche Hamria. Focus sur le tri des dechets et l'education au recyclage.",
    "campaign.4.title": "Nettoyage Sentier Borj Belkari",
    "campaign.4.location": "Borj Belkari, Route de Fes",
    "campaign.4.description":
      "Nettoyage de sentier en plein air le long de la route panoramique de Borj Belkari. Ideal pour les amoureux de la nature.",

    "contact.label": "CONTACT",
    "contact.heading": "Prenez Contact",
    "contact.body":
      "Vous avez des questions sur le benevolat, les partenariats ou l'organisation d'un nettoyage dans votre quartier ? Contactez-nous — nous repondons sous 24 heures.",
    "contact.name.placeholder": "Votre nom",
    "contact.email.placeholder": "votre@email.com",
    "contact.message.placeholder": "Comment pouvons-nous vous aider ?",
    "contact.submit": "Envoyer",
    "contact.sending": "Envoi en cours...",
    "contact.success": "Message envoye ! Nous vous repondrons bientot.",
    "contact.form_title": "Prenez Contact",
    "contact.form_subtitle":
      "Remplissez le formulaire ci-dessous et nous vous repondrons.",
    "contact.send_another": "Envoyer un autre message",

    "footer.tagline":
      "Rues Plus Propres. Parcs Plus Verts. Communaute Plus Forte.",
    "footer.copyright": "2025 Green Clean Meknes. Tous droits reserves.",
    "social.whatsapp": "WhatsApp",
    "social.instagram": "Instagram",
    "social.facebook": "Facebook",
    "footer.lang.en": "Anglais",
    "footer.lang.fr": "Francais",
    "footer.lang.ar": "Arabe",

    "login.welcome": "Bienvenue",
    "login.subtitle": "Connectez-vous pour rejoindre le mouvement",
    "login.coming_soon": "Bientot disponible",
    "gallery.label": "GALERIE",
    "gallery.empty": "Aucune photo dans la galerie.",
    "socialFeed.label": "ACTUALITÉS",
    "socialFeed.empty": "Aucune actualité sociale.",
    "socialFeed.heading": "Dernières Actualités",
    "socialFeed.subheading":
      "Suivez notre parcours et découvrez ce que notre communauté partage sur les réseaux.",
    "sponsors.label": "PARTENAIRES",
    "partners.empty": "Aucun partenaire pour le moment.",
    "sponsors.heading": "Nos Partenaires & Sponsors",
    "sponsors.subheading":
      "Des organisations et entreprises soutenant notre mission pour un Meknès plus propre.",
    "gallery.heading": "Avant & Après",
    "gallery.subheading":
      "Découvrez l'impact réel de nos bénévoles à travers Meknès.",
    "gallery.before": "Avant",
    "gallery.after": "Après",

    "login.account": "Compte",
    "login.signed_in_as": "Vous etes connecte en tant que",
    "login.role_admin": "administrateur",
    "login.role_volunteer": "volontaire",
    "login.admin_dashboard": "Tableau de bord Admin",
    "login.back_home": "Retour a l'accueil",
    "login.logout": "Deconnexion",
    "login.logging_out": "Deconnexion en cours...",
    "login.title": "Bienvenue",
    "login.or": "ou",
    "login.terms":
      "En vous connectant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialite.",

    "volunteer.form_title": "Devenez Benevole",
    "volunteer.form_subtitle":
      "Remplissez le formulaire ci-dessous et un administrateur examinera votre candidature.",
    "volunteer.name": "Nom Complet",
    "volunteer.email": "Adresse Email",
    "volunteer.phone": "Numero de Telephone (facultatif)",
    "volunteer.message": "Pourquoi souhaitez-vous rejoindre ? (facultatif)",
    "volunteer.submit": "Soumettre la Candidature",
    "volunteer.submitting": "Envoi en cours...",
    "volunteer.success":
      "Candidature soumise avec succes ! Un administrateur l'examinera bientot.",
    "volunteer.register_another": "Inscrire un autre benevole",
    "volunteer.success_subtitle":
      "Nous examinerons votre candidature et vous contacterons bientot.",
    "volunteer.no_account_note":
      "Aucun compte requis. Un administrateur examinera votre candidature.",

    "guest_register.title": "Rejoindre la campagne",
    "guest_register.success_title": "Inscription terminee",
    "guest_register.description":
      "Entrez vos coordonnees pour vous inscrire a cette campagne. Aucun compte requis.",
    "guest_register.name_placeholder": "Nom Complet",
    "guest_register.email_placeholder": "Adresse Email",
    "guest_register.registering": "Inscription en cours...",
    "guest_register.submit": "S'inscrire a la campagne",
    "guest_register.success_message": "Vous etes inscrit !",
    "guest_register.success_detail": "Nous enverrons les details a {email}",
    "guest_register.done": "Termine",
    "guest_register.toast_success": "Inscription reussie !",

    "profile.my_campaigns": "Mes Campagnes",
    "profile.no_campaigns":
      "Vous ne vous etes inscrit a aucune campagne pour le moment.",
    "profile.browse_campaigns": "Parcourir les Campagnes",

    "maintenance.title": "Maintenance en Cours",
    "maintenance.default_message":
      "Nous effectuons actuellement des mises a jour de securite et des ameliorations. Veuillez revenir bientot.",
    "maintenance.refresh": "Actualiser",
    "maintenance.admin_dashboard": "Tableau de Bord Admin",

    "two_factor.title": "Authentification a Deux Facteurs",
    "two_factor.enabled":
      "L'authentification a deux facteurs est activee pour votre compte.",
    "two_factor.disabled":
      "L'authentification a deux facteurs n'est pas activee.",
    "two_factor.enable_button": "Activer 2FA",
    "two_factor.disable_button": "Desactiver 2FA",
    "two_factor.setup_title": "Configurer l'Authentification a Deux Facteurs",
    "two_factor.setup_instruction":
      "Scannez le code QR avec votre application d'authentification, puis saisissez le code a 6 chiffres ci-dessous.",
    "two_factor.secret_fallback":
      "Vous ne pouvez pas scanner ? Saisissez ce secret manuellement :",
    "two_factor.verification_code": "Code de verification",
    "two_factor.backup_codes_title": "Codes de secours",
    "two_factor.backup_codes_instruction":
      "Conservez ces codes dans un endroit sur. Chaque code peut etre utilise une seule fois si vous perdez l'acces a votre application d'authentification.",
    "two_factor.verify_title": "Verifier l'Authentification a Deux Facteurs",
    "two_factor.verify_instruction":
      "Saisissez le code a 6 chiffres de votre application d'authentification pour continuer.",
    "two_factor.use_backup_code": "Utiliser un code de secours",
    "two_factor.use_totp_code": "Utiliser le code de l'application",
    "two_factor.backup_code": "Code de secours",
    "two_factor.submit": "Verifier",
    "two_factor.cancel": "Annuler",
    "two_factor.close": "Fermer",
    "two_factor.error_invalid_code":
      "Code de verification invalide. Veuillez reessayer.",
    "two_factor.error_setup_failed":
      "Echec de la configuration de l'authentification a deux facteurs.",
    "two_factor.error_disable_failed":
      "Echec de la desactivation de l'authentification a deux facteurs.",
    "two_factor.error_verify_failed":
      "Echec de la verification de l'authentification a deux facteurs.",
    "two_factor.success_enabled":
      "Authentification a deux facteurs activee avec succes.",
    "two_factor.success_disabled":
      "Authentification a deux facteurs desactivee avec succes.",
    "two_factor.success_verified": "Authentification a deux facteurs verifiee.",

    "login.provider.kimi": "Se connecter avec Kimi",
    "login.provider.google": "Se connecter avec Google",
    "login.provider.facebook": "Se connecter avec Facebook",
    "login.provider.tiktok": "Se connecter avec TikTok",
    "login.provider.x": "Se connecter avec X",
    "login.provider.microsoft": "Se connecter avec Microsoft",

    "air_quality.heading": "Qualité de l'Air à Meknès",
    "air_quality.subheading":
      "Données en direct sur la qualité de l'air à Meknès. Mises à jour horaires depuis Open-Meteo.",
    "air_quality.advice_good":
      "La qualité de l'air est bonne. Profitez des activités en plein air !",
    "air_quality.advice_moderate":
      "La qualité de l'air est modérée. Les personnes sensibles devraient limiter les efforts prolongés en plein air.",
    "air_quality.advice_sensitive":
      "La qualité de l'air est malsaine pour les groupes sensibles. Envisagez de porter un masque à l'extérieur.",
    "air_quality.advice_unhealthy":
      "La qualité de l'air est malsaine. Évitez les activités prolongées en plein air et portez un masque.",
    "air_quality.level_good": "Bonne",
    "air_quality.level_moderate": "Modérée",
    "air_quality.level_sensitive": "Malsaine pour les Groupes Sensibles",
    "air_quality.level_unhealthy": "Malsaine",
    "air_quality.level_very_unhealthy": "Très Malsaine",
    "air_quality.level_hazardous": "Dangereuse",
    "air_quality.pm25_desc":
      "Particules fines pouvant pénétrer profondément dans les poumons",
    "air_quality.pm10_desc":
      "Particules grossières provenant de la poussière et du pollen",
    "air_quality.no2_desc":
      "Dioxyde d'azote provenant du trafic et de l'industrie",
    "air_quality.o3_desc": "Ozone au sol, un irritant respiratoire",
    "air_quality.simulated": "Données simulées (API indisponible)",
    "air_quality.updated": "Mis à jour",
    "air_quality.location": "Emplacement",
    "air_quality.show_guide": "Comment Lire Ces Données",
    "air_quality.hide_guide": "Masquer le Guide",
    "air_quality.scale_title": "Échelle AQI",
    "air_quality.scale_desc":
      "L'Indice de Qualité de l'Air (AQI) va de 0 à 500. Plus la valeur est élevée, plus le niveau de pollution atmosphérique et de risque pour la santé est grand.",
    "air_quality.how_title": "Comprendre la Qualité de l'Air",
    "air_quality.what_is_aqi": "Qu'est-ce que l'AQI ?",
    "air_quality.what_is_aqi_desc":
      "L'Indice de Qualité de l'Air (AQI) est une échelle standardisée utilisée dans le monde entier pour communiquer le niveau de pollution atmosphérique actuel ou prévu. Il convertit des mesures complexes de polluants en un seul nombre facile à comprendre.",
    "air_quality.how_measured": "Comment est-ce mesuré ?",
    "air_quality.how_measured_desc":
      "Les stations de qualité de l'air mesurent les concentrations de polluants clés dans l'atmosphère — PM2.5, PM10, NO₂, SO₂, CO et O₃. Ces mesures sont intégrées dans une formule qui calcule une valeur AQI unique. Le polluant avec l'indice individuel le plus élevé détermine l'AQI global.",
    "air_quality.pollutants_title": "Que sont ces polluants ?",
    "air_quality.pollutants_desc":
      "Les PM2.5 et PM10 sont de minuscules particules solides ou liquides en suspension dans l'air. Le NO₂ provient principalement des échappements de véhicules et des émissions industrielles. Le SO₂ est produit par la combustion de combustibles fossiles. Le CO est un gaz incolore provenant d'une combustion incomplète. L'O₃ (ozone) se forme lorsque la lumière du soleil réagit avec d'autres polluants.",
    "air_quality.data_source": "D'où viennent ces données ?",
    "air_quality.data_source_desc":
      "Ces données proviennent d'Open-Meteo, une API mondiale de météo et de qualité de l'air qui agrège des données de stations de surveillance nationales et d'observations satellites. Lorsque les données en direct ne sont pas disponibles, nous affichons des valeurs simulées réalistes basées sur les conditions typiques de Meknès.",

    "poll.heading": "Sondage Communautaire",
    "poll.subheading":
      "Donnez votre avis sur ce qui compte le plus pour Meknès.",
    "poll.question": "Quelle zone de Meknès a le plus besoin d'être nettoyée ?",
    "poll.vote": "Voter",
    "poll.results": "Résultats",
    "poll.thanks": "Merci d'avoir voté !",
    "poll.votes": "votes",
    "poll.no_active": "Aucun sondage actif pour le moment.",
    "poll.option_1": "Vieille Médina",
    "poll.option_2": "Place el-Hedim",
    "poll.option_3": "Bords de la rivière Fert",
    "poll.option_4": "Quartiers résidentiels",
    "poll.option_5": "Parcs publics",

    "error.modal.title": "Quelque chose s'est mal passé",
    "error.modal.retry": "Réessayer",
    "error.modal.dismiss": "Ignorer",
    "error.modal.close": "Fermer",
    "error.modal.network":
      "Erreur réseau. Veuillez vérifier votre connexion et réessayer.",
    "error.modal.auth": "Authentification échouée. Veuillez vous reconnecter.",
    "error.modal.generic": "Une erreur s'est produite. Veuillez réessayer.",
    "error.modal.oauth_denied":
      "La connexion a été annulée. Vous pouvez réessayer quand vous voulez.",
    "error.modal.oauth_failed":
      "La connexion a échoué. Veuillez réessayer ou utiliser une autre méthode.",
    "error.modal.rate_limit":
      "Trop de tentatives. Veuillez attendre un moment et réessayer.",
    "error.modal.csrf": "Validation de sécurité échouée. Veuillez réessayer.",
    "error.modal.pkce": "Session de connexion expirée. Veuillez réessayer.",
    "error.modal.redirect":
      "Redirection invalide. Veuillez réessayer depuis la page d'accueil.",
    "error.modal.permission":
      "Vous n'avez pas la permission d'effectuer cette action.",
    "error.modal.not_found": "La ressource demandée n'a pas été trouvée.",
    "error.modal.server": "Erreur serveur. Veuillez réessayer plus tard.",
    "error.modal.offline":
      "Vous semblez hors ligne. Veuillez vérifier votre connexion.",
    "error.modal.unauthorized":
      "Vous devez être connecté pour effectuer cette action.",

    "toast.success": "Succès",
    "toast.error": "Erreur",
    "toast.saved": "Enregistré avec succès",
    "toast.created": "Créé avec succès",
    "toast.updated": "Mis à jour avec succès",
    "toast.deleted": "Supprimé avec succès",
    "toast.vote_cast": "Vote enregistré",
    "toast.vote_already": "Vous avez déjà voté",
    "toast.settings_saved": "Paramètres enregistrés",
    "toast.campaign_created": "Campagne créée",
    "toast.campaign_updated": "Campagne mise à jour",
    "toast.campaign_deleted": "Campagne supprimée",
    "toast.testimonial_created": "Témoignage créé",
    "toast.testimonial_updated": "Témoignage mis à jour",
    "toast.testimonial_deleted": "Témoignage supprimé",
    "toast.poll_created": "Sondage créé",
    "toast.poll_updated": "Sondage mis à jour",
    "toast.poll_deleted": "Sondage supprimé",
    "toast.faq_created": "FAQ créé",
    "toast.faq_updated": "FAQ mis à jour",
    "toast.faq_deleted": "FAQ supprimé",
    "toast.photo_created": "Photo ajoutée",
    "toast.photo_updated": "Photo mise à jour",
    "toast.photo_deleted": "Photo supprimée",
    "toast.socialFeed_created": "Publication ajoutée",
    "toast.socialFeed_updated": "Publication mise à jour",
    "toast.socialFeed_deleted": "Publication supprimée",
    "toast.sponsor_created": "Partenaire ajouté",
    "toast.sponsor_updated": "Partenaire mis à jour",
    "toast.sponsor_deleted": "Partenaire supprimé",
    "toast.status_updated": "Statut mis à jour",
    "toast.visibility_toggled": "Visibilité mise à jour",
    "toast.volunteer_updated": "Statut du bénévole mis à jour",
    "toast.volunteer_deleted": "Bénévole supprimé",
    "toast.error_generic": "Une erreur s'est produite. Veuillez réessayer.",
    "toast.error_auth": "Authentification échouée. Veuillez vous reconnecter.",
    "toast.error_network": "Erreur réseau. Veuillez vérifier votre connexion.",

    "countdown.next_campaign": "Prochaine Campagne",
    "countdown.days": "Jours",
    "countdown.hours": "Heures",
    "countdown.minutes": "Minutes",
    "countdown.seconds": "Secondes",
    "countdown.started": "Campagne Commencée !",

    "neighborhoods.label": "QUARTIERS",
    "neighborhoods.heading": "Nos Quartiers",
    "neighborhoods.subheading":
      "Découvrez les communautés que nous servons à travers Meknès.",
    "neighborhoods.loading": "Chargement des quartiers...",
    "neighborhoods.not_found": "Quartier Non Trouvé",
    "neighborhoods.not_found_desc":
      "Le quartier que vous recherchez n'existe pas.",
    "neighborhoods.back_home": "Retour à l'accueil",
    "neighborhoods.location": "Meknès, Maroc",
    "neighborhoods.stats": "Statistiques d'Impact",
    "share.text":
      "Rejoignez le nettoyage {title} a Meknes le {date} ! {description}",
    "toast.copied": "Copie ! Coller pour partager",

    "badge.title": "Badge de campagne",
    "badge.loading": "Chargement de votre badge...",
    "badge.qr_alt": "Code QR du badge de campagne",
    "badge.copy": "Copier",
    "badge.copied": "Copié",
    "badge.copy_failed": "Impossible de copier",
    "badge.hint": "Montrez ce QR code à un coordinateur pour pointer.",
    "badge.attended": "Présent",
    "badge.not_attended": "Absent",
    "badge.show_badge": "Afficher le badge",
    "badge.verify_title": "Vérifier le badge",
    "badge.verify_placeholder": "Collez le token du badge ici...",
    "badge.verify": "Vérifier le badge",
    "badge.verifying": "Vérification...",
    "badge.verified": "Vérifié",
    "badge.already_attended": "Déjà présent",
    "badge.unknown_user": "Utilisateur inconnu",
    "badge.campaign": "Campagne",
    "badge.role_label": "Rôle",
    "badge.presence_title": "Contrôle de présence",
    "badge.scan_badge": "Scanner le badge",
    "badge.select_campaign": "Sélectionner une campagne",
    "badge.select_campaign_prompt":
      "Sélectionnez une campagne pour voir les inscriptions.",
    "badge.search_placeholder": "Rechercher des bénévoles...",
    "badge.registered": "Inscrits",
    "badge.present": "Présent",
    "badge.volunteer": "Bénévole",
    "badge.status": "Statut",
    "badge.mark_present": "Marquer présent",
    "badge.mark_absent": "Marquer absent",
    "badge.attendance_updated": "Présence mise à jour",
    "badge.attendance_update_failed": "Échec de la mise à jour de la présence",
    "badge.no_registrations": "Aucune inscription pour le moment.",
    "badge.paste_token": "Coller le token",
    "badge.scan_with_camera": "Scanner avec l'appareil",
    "badge.camera_loading": "Démarrage de la caméra...",
    "badge.camera_not_found": "Aucune caméra détectée",

    "leaderboard.heading": "Meilleurs bénévoles",
    "leaderboard.subheading": "Célébrons ceux qui rendent Meknès plus propre, une campagne à la fois.",
    "leaderboard.rank": "Classement",
    "leaderboard.points": "points",
    "leaderboard.participants": "participants",
    "leaderboard.campaigns_attended": "campagnes suivies",
    "leaderboard.view_all": "Voir le classement complet",
    "leaderboard.empty": "Aucun bénévole dans le classement pour le moment.",
    "leaderboard.loading": "Chargement du classement...",
    "leaderboard.period.all": "Tous les temps",
    "leaderboard.period.year": "Cette année",
    "leaderboard.period.month": "Ce mois",
    "leaderboard.search_placeholder": "Rechercher des bénévoles...",
    "leaderboard.no_search_results": "Aucun bénévole ne correspond à votre recherche.",
    "leaderboard.guest": "Invité",

    "admin.leaderboard.title": "Classement",
    "admin.leaderboard.award_points": "Attribuer des points",
    "admin.leaderboard.select_user": "Sélectionner un bénévole",
    "admin.leaderboard.points": "Points",
    "admin.leaderboard.reason": "Raison",
    "admin.leaderboard.award": "Attribuer",
    "admin.leaderboard.search": "Rechercher dans le classement...",
    "admin.leaderboard.points_system": "Système de points",
    "admin.leaderboard.points_system_help": "Définissez combien de points les bénévoles gagnent automatiquement lors de l'inscription à une campagne, lorsque leur présence est confirmée, et pour chaque kilogramme de déchets collectés personnellement. Les déchets sont répartis équitablement entre tous les participants de chaque campagne.",
    "admin.leaderboard.points_registration": "Points par inscription",
    "admin.leaderboard.points_attendance": "Points par présence",
    "admin.leaderboard.points_per_waste_kg": "Points par kg de déchets",
    "admin.leaderboard.save_points": "Enregistrer les points",
    "admin.leaderboard.saving": "Enregistrement...",
    "admin.leaderboard.invalid_points": "Les valeurs de points doivent être des nombres positifs ou nuls.",

    "toast.points_awarded": "Points attribués",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.about": "من نحن",
    "nav.leaderboard": "المتصدرين",
    "nav.campaigns": "الحملات",
    "nav.contact": "اتصل بنا",

    "hero.heading": "مكناس نظيفة، حملة بحملة",
    "hero.subheading":
      "انضم إلى مجتمع من المواطنين الملتزمين بشوارع أنظف وحدائق أخضر ومكناس أكثر صحة.",
    "hero.cta": "انضم إلى حملة",
    "hero.cta_unauth": "انضم إلى الحركة",

    "about.label": "حول المبادرة",
    "about.heading": "حركة انطلقت من شوارع مكناس",
    "about.body":
      "جرين مكناس هي مبادرة مواطنة تجمع بين الأفراد والأحياء والمنظمات المحلية لاتخاذ إجراءات مباشرة ضد القمامة والتلوث في مدينتنا. منذ عام 2023، نظمنا أكثر من 40 حملة تنظيف في جميع أنحاء مكناس، مما حشد مئات المتطوعين وأزال أطنانًا من النفايات من الأماكن العامة. مهمتنا بسيطة: مكناس أنظف تبدأ بكل واحد منا.",
    "about.stat1.number": "40+",
    "about.stat1.label": "حملة",
    "about.stat2.number": "800+",
    "about.stat2.label": "متطوع",
    "about.stat3.number": "12",
    "about.stat3.label": "حي",

    "join.label": "شارك معنا",
    "join.heading": "ثلاث طرق لإحداث فرق",
    "join.card1.title": "انضم كمتطوع",
    "join.card1.body":
      "سجل في حملات التنظيف القادمة. نوفر جميع الأدوات — القفازات والأكياس والمشروبات. أنت تجلب الطاقة.",
    "join.card1.cta": "عرض الحملات",
    "join.card2.title": "انشر الخبر",
    "join.card2.body":
      "شارك حملاتنا على وسائل التواصل الاجتماعي. كل مشاركة تجلب متطوعين جدد وتزيد الوعي حول الحفاظ على نظافة مكناس.",
    "join.card2.cta": "شارك الآن",
    "join.card3.title": "كن شريكًا",
    "join.card3.body":
      "يمكن للمنظمات والمدارس والشركات رعاية الحملات أو تنظيم أيام تنظيف للشركات. لنتعاون.",
    "join.card3.cta": "اتصل بنا",

    "faq.label": "الأسئلة الشائعة",
    "faq.empty": "لا توجد أسئلة شائعة بعد.",
    "faq.heading": "أسئلة متكررة",
    "faq.subheading": "كل ما تحتاج لمعرفته قبل الانضمام إلى حملة.",
    "faq.q1": "هل أحتاج إلى إحضار أي شيء؟",
    "faq.a1":
      "نوفر القفازات وأكياس القمامة والأدوات الأساسية. فقط أحضر الماء والملابس المريحة وحماستك!",
    "faq.q2": "هل هناك حد عمر؟",
    "faq.a2":
      "المتطوعون من جميع الأعمار مرحب بهم! يجب أن يكون الأطفال دون 16 عامًا برفقة شخص بالغ. لدينا مهام مناسبة للجميع.",
    "faq.q3": "كم تستمر الحملات؟",
    "faq.a3":
      "تستمر معظم الحملات من 2 إلى 4 ساعات، عادة في صباحات عطلة نهاية الأسبوع. نعلن دائمًا عن المدة الدقيقة عند تسجيلك.",
    "faq.q4": "هل يمكنني تنظيم حملة في حيّي؟",
    "faq.a4":
      "بالتأكيد! تواصل معنا عبر النموذج أدناه وسنساعدك في التخطيط والترويج لحملة تنظيف في منطقتك.",
    "faq.q5": "هل التطوع آمن؟",
    "faq.a5":
      "نعم، السلامة هي أولويتنا. نقدم إحاطات أمنية وحقائب إسعافات أولية ولا نعمل أبدًا في مناطق خطرة. جميع المتطوعين مغطيون بتأميننا.",

    "donation.label": "تبرع",
    "donation.title": "ادعم مهمتنا",
    "donation.description":
      "مساهمتك تساعدنا في تنظيم المزيد من حملات التنظيف ونشر الوعي في جميع أنحاء مكناس.",
    "donation.bank_transfer": "التحويل البنكي",
    "donation.copy": "نسخ",
    "donation.paypal": "باي بال",
    "donation.paypal_cta": "تبرع عبر باي بال",
    "donation.impact_title": "أين تذهب تبرعاتك",
    "donation.impact_1":
      "مستلزمات التنظيف (قفازات، أكياس، أدوات) لـ {campaigns}+ حملة سنويًا",
    "donation.impact_2": "المشروبات والمعدات الأمنية لـ {volunteers}+ متطوع",
    "donation.impact_3":
      "المواد التعليمية وحملات التوعية في {neighborhoods} حي",
    "donation.impact_4": "مشاريع زراعة الأشجار واستعادة المساحات الخضراء",
    "donation.bank_name": "اسم البنك",
    "donation.account_holder": "صاحب الحساب",
    "donation.iban": "رقم الحساب المصرفي الدولي",
    "donation.swift": "رمز SWIFT/BIC",

    "nav.login": "تسجيل الدخول",
    "nav.account": "الحساب",
    "nav.admin": "المسؤول",

    "theme.dark_mode": "الوضع الداكن",
    "theme.light_mode": "الوضع الفاتح",
    "theme.auto_mode": "تلقائي (مكناس)",

    "weather.clear_day": "سماء صافية",
    "weather.clear_night": "ليل صافٍ",
    "weather.cloudy": "غائم",
    "weather.rain": "ممطر",
    "weather.snow": "ثلوج",
    "weather.thunderstorm": "عاصفة رعدية",
    "weather.humidity": "الرطوبة",
    "weather.wind": "الرياح",
    "weather.wind_kmh": "{speed} كم/س",

    "impact.heading": "تأثيرنا",
    "impact.subheading": "أرقام حقيقية من حملات حقيقية في مكناس.",
    "impact.campaigns": "حملات مكتملة",
    "impact.volunteers": "متطوعين نشطين",
    "impact.waste": "كيلوغرام من النفايات المجمعة",
    "impact.trees": "أشجار مزروعة",
    "impact.neighborhoods": "أحياء",

    "testimonials.heading": "ما يقوله المتطوعون",
    "testimonials.subheading": "قصص حقيقية من مواطنين يجعلون مكناس أنظف.",
    "testimonials.label": "آراء المتطوعين",
    "testimonials.empty": "لا توجد آراء بعد.",

    "community.label": "المجتمع",
    "community.heading": "أصوات المجتمع",
    "community.subheading":
      "استكشف القصص والشركاء والتحديثات الاجتماعية والمزيد من مجتمعنا المتنامي.",

    "poll.label": "استطلاع",

    "contact.error.generic": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    "contact.error.invalid_email": "يرجى إدخال عنوان بريد إلكتروني صالح.",
    "contact.error.invalid_chars": "تم اكتشاف أحرف غير صالحة.",

    "campaigns.filter.all": "الكل",
    "campaigns.filter.outdoor": "في الهواء الطلق",
    "campaigns.filter.community": "مجتمعي",
    "campaigns.filter.green": "أخضر",
    "campaigns.filter.trail": "مسار",
    "campaigns.filter.water": "ماء",
    "campaigns.discover_title": "اكتشف حملتك",
    "campaigns.discover_body":
      "ارسم شكلًا على هذه اللوحة لتصفية الحملات. كل شكل يسلط الضوء على أنواع مختلفة من الحملات.",
    "campaigns.instruction_fallback":
      "ارسم شكلًا أو اضغط على زر لتصفية الحملات",
    "campaigns.heading": "الحملات القادمة",
    "campaigns.subheading":
      "انقر على فلتر أو مرر فوق الدبابيس على الخريطة التكتيكية للعثور على الحملات حسب الموضوع.",
    "campaigns.canvas.placeholder": "ارسم التزامك",
    "campaigns.canvas.instruction": "ارسم شكلًا لاكتشاف حملتك القادمة",
    "campaigns.share": "مشاركة",
    "campaigns.register": "سجل",
    "campaigns.registered": "مسجل",
    "campaigns.registered_count": "مسجلين",
    "campaigns.status.upcoming": "قادمة",
    "campaigns.status.ongoing": "جارية",
    "campaigns.status.completed": "مكتملة",
    "campaigns.status.cancelled": "ملغاة",
    "campaigns.completed": "مكتملة",
    "campaigns.status_label": "حالة الحملة",
    "campaigns.impact_stats": "إحصائيات التأثير",
    "campaigns.stats.waste": "كجم نفايات",
    "campaigns.stats.trees": "شجرة",
    "campaigns.stats.volunteers": "متطوع",
    "campaigns.stats.neighborhoods": "حي",
    "campaigns.stats.waste_label": "النفايات المجمعة (كجم)",
    "campaigns.stats.trees_label": "الأشجار المزروعة",
    "campaigns.stats.volunteers_label": "المتطوعون",
    "campaigns.stats.neighborhoods_label": "الأحياء",
    "campaigns.image_missing": "الصورة قادمة قريباً",

    "campaign.1.title": "تنظيف ساحة باب المنصور",
    "campaign.1.location": "باب المنصور، المدينة القديمة",
    "campaign.1.description":
      "انضم إلى أكثر من 50 متطوعًا لتنظيف صباحي حول بوابة باب المنصور الأيقونية والساحة المحيطة بها.",
    "campaign.2.title": "تجديد حديقة المدينة الجديدة",
    "campaign.2.location": "شارع مولاي إسماعيل، المدينة الجديدة",
    "campaign.2.description":
      "ساعد في استعادة جمال حدائق المدينة الجديدة. غرس الأشجار وجمع القمامة وإصلاح المقاعد.",
    "campaign.3.title": "تنظيف عميق لسوق الحامري",
    "campaign.3.location": "سوق الحامري، الحامري",
    "campaign.3.description":
      "تنظيف شامل لمنطقة سوق الحامري. التركيز على فرز النفايات والتوعية بإعادة التدوير.",
    "campaign.4.title": "تنظيف مسار برج بلكاري",
    "campaign.4.location": "برج بلكاري، طريق فاس",
    "campaign.4.description":
      "تنظيف مسار في الهواء الطلق على طول طريق برج بلكاري الخلاب. رائع لعشاق الطبيعة.",

    "contact.label": "اتصل بنا",
    "contact.heading": "تواصل معنا",
    "contact.body":
      "لديك أسئلة حول التطوع أو الشراكات أو تنظيم حملة تنظيف في حيك؟ تواصل معنا — نرد خلال 24 ساعة.",
    "contact.name.placeholder": "اسمك",
    "contact.email.placeholder": "بريدك@الإلكتروني.com",
    "contact.message.placeholder": "كيف يمكننا المساعدة؟",
    "contact.submit": "إرسال الرسالة",
    "contact.sending": "جاري الإرسال...",
    "contact.success": "تم إرسال الرسالة! سنتواصل معك قريبًا.",
    "contact.form_title": "تواصل معنا",
    "contact.form_subtitle": "املأ النموذج أدناه وسنرد عليك.",
    "contact.send_another": "إرسال رسالة أخرى",

    "footer.tagline": "شوارع أنظف. حدائق أخضر. مجتمع أقوى.",
    "footer.copyright": "2025 جرين مكناس. جميع الحقوق محفوظة.",
    "social.whatsapp": "واتساب",
    "social.instagram": "إنستغرام",
    "social.facebook": "فيسبوك",
    "footer.lang.en": "الإنجليزية",
    "footer.lang.fr": "الفرنسية",
    "footer.lang.ar": "العربية",

    "login.welcome": "مرحباً",
    "login.subtitle": "سجّل الدخول للانضمام إلى الحركة",
    "login.coming_soon": "قريباً",
    "gallery.label": "معرض الصور",
    "gallery.empty": "لا توجد صور في المعرض بعد.",
    "socialFeed.label": "آخر الأخبار",
    "socialFeed.empty": "لا توجد منشورات اجتماعية بعد.",
    "socialFeed.heading": "آخر الأخبار على وسائل التواصل",
    "socialFeed.subheading":
      "تابع رحلتنا وشاهد ما تشاركه مجتمعاتنا عبر المنصات.",
    "sponsors.label": "الشركاء",
    "partners.empty": "لا يوجد شركاء بعد.",
    "sponsors.heading": "شركاؤنا وداعمونا",
    "sponsors.subheading":
      "منظمات وأعمال تجارية تدعم مهمتنا من أجل مكناس أنظف.",
    "gallery.heading": "قبل وبعد",
    "gallery.subheading":
      "شاهد التأثير الحقيقي الذي يحدثه متطوعونا في جميع أنحاء مكناس.",
    "gallery.before": "قبل",
    "gallery.after": "بعد",

    "login.account": "الحساب",
    "login.signed_in_as": "تم تسجيل دخولك كـ",
    "login.role_admin": "مسؤول",
    "login.role_volunteer": "متطوع",
    "login.admin_dashboard": "لوحة التحكم",
    "login.back_home": "العودة للرئيسية",
    "login.logout": "تسجيل الخروج",
    "login.logging_out": "جاري تسجيل الخروج...",
    "login.title": "مرحباً",
    "login.or": "أو",
    "login.terms":
      "بتسجيل الدخول، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.",

    "volunteer.form_title": "كن متطوعاً",
    "volunteer.form_subtitle": "املأ النموذج أدناه وسيقوم المشرف بمراجعة طلبك.",
    "volunteer.name": "الاسم الكامل",
    "volunteer.email": "عنوان البريد الإلكتروني",
    "volunteer.phone": "رقم الهاتف (اختياري)",
    "volunteer.message": "لماذا تريد الانضمام؟ (اختياري)",
    "volunteer.submit": "تقديم الطلب",
    "volunteer.submitting": "جاري الإرسال...",
    "volunteer.success": "تم تقديم الطلب بنجاح! سيقوم المشرف بمراجعته قريباً.",
    "volunteer.register_another": "تسجيل متطوع آخر",
    "volunteer.success_subtitle": "سنراجع طلبك ونتواصل معك قريباً.",
    "volunteer.no_account_note": "لا حاجة لحساب. سيقوم المشرف بمراجعة طلبك.",

    "guest_register.title": "الانضمام للحملة",
    "guest_register.success_title": "اكتمل التسجيل",
    "guest_register.description":
      "أدخل بياناتك للتسجيل في هذه الحملة. لا حاجة لحساب.",
    "guest_register.name_placeholder": "الاسم الكامل",
    "guest_register.email_placeholder": "عنوان البريد الإلكتروني",
    "guest_register.registering": "جاري التسجيل...",
    "guest_register.submit": "التسجيل في الحملة",
    "guest_register.success_message": "تم تسجيلك!",
    "guest_register.success_detail": "سنرسل التفاصيل إلى {email}",
    "guest_register.done": "تم",
    "guest_register.toast_success": "تم التسجيل بنجاح!",

    "profile.my_campaigns": "حملاتي",
    "profile.no_campaigns": "لم تسجل في أي حملة بعد.",
    "profile.browse_campaigns": "تصفح الحملات",

    "maintenance.title": "تحت الصيانة",
    "maintenance.default_message":
      "نحن نقوم حالياً بتحديثات أمنية وتحسينات. يرجى العودة قريباً.",
    "maintenance.refresh": "تحديث",
    "maintenance.admin_dashboard": "لوحة تحكم المشرف",

    "two_factor.title": "المصادقة الثنائية",
    "two_factor.enabled": "المصادقة الثنائية مفعلة لحسابك.",
    "two_factor.disabled": "المصادقة الثنائية غير مفعلة.",
    "two_factor.enable_button": "تفعيل المصادقة الثنائية",
    "two_factor.disable_button": "تعطيل المصادقة الثنائية",
    "two_factor.setup_title": "إعداد المصادقة الثنائية",
    "two_factor.setup_instruction":
      "امسح رمز QR بتطبيق المصادقة، ثم أدخل الرمز المكون من 6 أرقام أدناه.",
    "two_factor.secret_fallback": "لا يمكنك المسح؟ أدخل هذا السر يدوياً:",
    "two_factor.verification_code": "رمز التحقق",
    "two_factor.backup_codes_title": "رموز الاسترداد",
    "two_factor.backup_codes_instruction":
      "احفظ هذه الرموز في مكان آمن. يمكن استخدام كل رمز مرة واحدة إذا فقدت الوصول إلى تطبيق المصادقة.",
    "two_factor.verify_title": "التحقق من المصادقة الثنائية",
    "two_factor.verify_instruction":
      "أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة للمتابعة.",
    "two_factor.use_backup_code": "استخدام رمز استرداد",
    "two_factor.use_totp_code": "استخدام رمز التطبيق",
    "two_factor.backup_code": "رمز الاسترداد",
    "two_factor.submit": "تحقق",
    "two_factor.cancel": "إلغاء",
    "two_factor.close": "إغلاق",
    "two_factor.error_invalid_code":
      "رمز التحقق غير صالح. يرجى المحاولة مرة أخرى.",
    "two_factor.error_setup_failed": "فشل إعداد المصادقة الثنائية.",
    "two_factor.error_disable_failed": "فشل تعطيل المصادقة الثنائية.",
    "two_factor.error_verify_failed": "فشل التحقق من المصادقة الثنائية.",
    "two_factor.success_enabled": "تم تفعيل المصادقة الثنائية بنجاح.",
    "two_factor.success_disabled": "تم تعطيل المصادقة الثنائية بنجاح.",
    "two_factor.success_verified": "تم التحقق من المصادقة الثنائية.",

    "login.provider.kimi": "تسجيل الدخول عبر Kimi",
    "login.provider.google": "تسجيل الدخول عبر Google",
    "login.provider.facebook": "تسجيل الدخول عبر Facebook",
    "login.provider.tiktok": "تسجيل الدخول عبر TikTok",
    "login.provider.x": "تسجيل الدخول عبر X",
    "login.provider.microsoft": "تسجيل الدخول عبر Microsoft",

    "air_quality.heading": "جودة الهواء في مكناس",
    "air_quality.subheading":
      "بيانات جودة الهواء المباشرة لمكناس. تحديث كل ساعة من Open-Meteo.",
    "air_quality.advice_good": "جودة الهواء جيدة. استمتع بالأنشطة الخارجية!",
    "air_quality.advice_moderate":
      "جودة الهواء متوسطة. يجب على الأشخاص الحساسين تحديد الجهد الخارجي المطول.",
    "air_quality.advice_sensitive":
      "جودة الهواء غير صحية للمجموعات الحساسة. فكر في ارتداء قناع في الخارج.",
    "air_quality.advice_unhealthy":
      "جودة الهواء غير صحية. تجنب الأنشطة الخارجية المطولة وارتدِ قناعاً.",
    "air_quality.level_good": "جيدة",
    "air_quality.level_moderate": "متوسطة",
    "air_quality.level_sensitive": "غير صحية للمجموعات الحساسة",
    "air_quality.level_unhealthy": "غير صحية",
    "air_quality.level_very_unhealthy": "سيئة جداً",
    "air_quality.level_hazardous": "خطيرة",
    "air_quality.pm25_desc": "جسيمات دقيقة يمكنها اختراق الرئتين بعمق",
    "air_quality.pm10_desc": "جسيمات خشنة من الغبار وحبوب اللقاح",
    "air_quality.no2_desc": "ثاني أكسيد النيتروجين من حركة المرور والصناعة",
    "air_quality.o3_desc": "الأوزون الأرضي، مهيج للجهاز التنفسي",
    "air_quality.simulated": "بيانات محاكاة (واجهة برمجة التطبيقات غير متوفرة)",
    "air_quality.updated": "تم التحديث",
    "air_quality.location": "الموقع",
    "air_quality.show_guide": "كيف تقرأ هذه البيانات",
    "air_quality.hide_guide": "إخفاء الدليل",
    "air_quality.scale_title": "مؤشر جودة الهواء",
    "air_quality.scale_desc":
      "مؤشر جودة الهواء (AQI) يتراوح من 0 إلى 500. كلما ارتفعت القيمة، زاد مستوى تلوث الهواء والقلق الصحي.",
    "air_quality.how_title": "فهم جودة الهواء",
    "air_quality.what_is_aqi": "ما هو مؤشر جودة الهواء؟",
    "air_quality.what_is_aqi_desc":
      "مؤشر جودة الهواء (AQI) هو مقياس موحد يُستخدم على مستوى العالم للتواصل حول مدى تلوث الهواء حالياً أو المتوقب. يحول قياسات الملوثات المعقدة إلى رقم واحد سهل الفهم.",
    "air_quality.how_measured": "كيف يتم قياسه؟",
    "air_quality.how_measured_desc":
      "تقيس محطات جودة الهواء تراكيز الملوثات الرئيسية في الغلاف الجوي — PM2.5، PM10، NO₂، SO₂، CO، وO₃. تُدخل هذه القياسات في صيغة تحسب قيمة AQI واحدة. الملوث ذو أعلى مؤشر فردي يحدد مؤشر AQI الإجمالي.",
    "air_quality.pollutants_title": "ما هي هذه الملوثات؟",
    "air_quality.pollutants_desc":
      "PM2.5 وPM10 هي جسيمات صلبة أو سائلة صغيرة جداً معلقة في الهواء. يأتي NO₂ بشكل أساسي من عوادم المركبات والانبعاثات الصناعية. يُنتج SO₂ عن حرق الوقود الأحفوري. CO هو غاز عديم اللون ناتج عن الاحتراق غير الكامل. يتشكل O₃ (الأوزون) عندما تتفاعل أشعة الشمس مع ملوثات أخرى.",
    "air_quality.data_source": "من أين تأتي هذه البيانات؟",
    "air_quality.data_source_desc":
      "تأتي هذه البيانات من Open-Meteo، وهي واجهة برمجة تطبيقات عالمية للطقس وجودة الهواء تجمع البيانات من محطات المراقبة الوطنية والمراقبة بالأقمار الصناعية. عندما تكون البيانات المباشرة غير متوفرة، نعرض قيم محاكاة واقعية بناءً على الظروف النموذجية لمكناس.",

    "poll.heading": "استطلاع المجتمع",
    "poll.subheading": "أبدِ رأيك فيما يهم مكناس أكثر.",
    "poll.question": "ما هي منطقة مكناس التي تحتاج إلى التنظيف أكثر؟",
    "poll.vote": "صوت",
    "poll.results": "النتائج",
    "poll.thanks": "شكراً لك على التصويت!",
    "poll.votes": "أصوات",
    "poll.no_active": "لا يوجد استطلاع نشط حالياً.",
    "poll.option_1": "المدينة القديمة",
    "poll.option_2": "ساحة الحديم",
    "poll.option_3": "ضفاف نهر فرت",
    "poll.option_4": "الأحياء السكنية",
    "poll.option_5": "الحدائق العامة",

    "error.modal.title": "حدث خطأ ما",
    "error.modal.retry": "إعادة المحاولة",
    "error.modal.dismiss": "تجاهل",
    "error.modal.close": "إغلاق",
    "error.modal.network":
      "خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.",
    "error.modal.auth": "فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.",
    "error.modal.generic": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    "error.modal.oauth_denied":
      "تم إلغاء تسجيل الدخول. يمكنك المحاولة مرة أخرى في أي وقت.",
    "error.modal.oauth_failed":
      "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى أو استخدام طريقة أخرى.",
    "error.modal.rate_limit":
      "محاولات كثيرة جداً. يرجى الانتظار قليلاً والمحاولة مرة أخرى.",
    "error.modal.csrf": "فشل التحقق الأمني. يرجى المحاولة مرة أخرى.",
    "error.modal.pkce": "انتهت جلسة تسجيل الدخول. يرجى المحاولة مرة أخرى.",
    "error.modal.redirect":
      "إعادة توجيه غير صالحة. يرجى المحاولة مرة أخرى من الصفحة الرئيسية.",
    "error.modal.permission": "ليس لديك الإذن لتنفيذ هذا الإجراء.",
    "error.modal.not_found": "لم يتم العثور على المورد المطلوب.",
    "error.modal.server": "خطأ في الخادم. يرجى المحاولة لاحقاً.",
    "error.modal.offline": "يبدو أنك غير متصل. يرجى التحقق من الاتصال.",
    "error.modal.unauthorized": "يجب تسجيل الدخول لتنفيذ هذا الإجراء.",

    "toast.success": "نجاح",
    "toast.error": "خطأ",
    "toast.saved": "تم الحفظ بنجاح",
    "toast.created": "تم الإنشاء بنجاح",
    "toast.updated": "تم التحديث بنجاح",
    "toast.deleted": "تم الحذف بنجاح",
    "toast.vote_cast": "تم تسجيل التصويت",
    "toast.vote_already": "لقد صوت بالفعل",
    "toast.settings_saved": "تم حفظ الإعدادات",
    "toast.campaign_created": "تم إنشاء الحملة",
    "toast.campaign_updated": "تم تحديث الحملة",
    "toast.campaign_deleted": "تم حذف الحملة",
    "toast.testimonial_created": "تم إنشاء الشهادة",
    "toast.testimonial_updated": "تم تحديث الشهادة",
    "toast.testimonial_deleted": "تم حذف الشهادة",
    "toast.poll_created": "تم إنشاء الاستطلاع",
    "toast.poll_updated": "تم تحديث الاستطلاع",
    "toast.poll_deleted": "تم حذف الاستطلاع",
    "toast.faq_created": "تم إنشاء الأسئلة الشائعة",
    "toast.faq_updated": "تم تحديث الأسئلة الشائعة",
    "toast.faq_deleted": "تم حذف الأسئلة الشائعة",
    "toast.photo_created": "تمت إضافة الصورة",
    "toast.photo_updated": "تم تحديث الصورة",
    "toast.photo_deleted": "تم حذف الصورة",
    "toast.socialFeed_created": "تمت إضافة المنشور",
    "toast.socialFeed_updated": "تم تحديث المنشور",
    "toast.socialFeed_deleted": "تم حذف المنشور",
    "toast.sponsor_created": "تمت إضافة الشريك",
    "toast.sponsor_updated": "تم تحديث الشريك",
    "toast.sponsor_deleted": "تم حذف الشريك",
    "toast.status_updated": "تم تحديث الحالة",
    "toast.visibility_toggled": "تم تحديث الرؤية",
    "toast.volunteer_updated": "تم تحديث حالة المتطوع",
    "toast.volunteer_deleted": "تم حذف المتطوع",
    "toast.error_generic": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    "toast.error_auth": "فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.",
    "toast.error_network": "خطأ في الشبكة. يرجى التحقق من الاتصال.",

    "countdown.next_campaign": "الحملة القادمة",
    "countdown.days": "أيام",
    "countdown.hours": "ساعات",
    "countdown.minutes": "دقائق",
    "countdown.seconds": "ثواني",
    "countdown.started": "بدأت الحملة!",

    "neighborhoods.label": "الأحياء",
    "neighborhoods.heading": "أحياؤنا",
    "neighborhoods.subheading":
      "اكتشف المجتمعات التي نخدمها في جميع أنحاء مكناس.",
    "neighborhoods.loading": "جاري تحميل الأحياء...",
    "neighborhoods.not_found": "الحي غير موجود",
    "neighborhoods.not_found_desc": "الحي الذي تبحث عنه غير موجود.",
    "neighborhoods.back_home": "العودة للرئيسية",
    "neighborhoods.location": "مكناس، المغرب",
    "neighborhoods.stats": "إحصائيات التأثير",
    "share.text":
      "انضم إلى حملة تنظيف {title} في مكناس يوم {date}! {description}",
    "toast.copied": "تم النسخ! الصق للمشاركة",

    "badge.title": "شارة الحملة",
    "badge.loading": "جاري تحميل شارتك...",
    "badge.qr_alt": "رمز QR للشارة",
    "badge.copy": "نسخ",
    "badge.copied": "تم النسخ",
    "badge.copy_failed": "تعذر النسخ",
    "badge.hint": "أظهر رمز QR للمنسق لتسجيل الحضور.",
    "badge.attended": "حاضر",
    "badge.not_attended": "غير حاضر",
    "badge.show_badge": "إظهار الشارة",
    "badge.verify_title": "التحقق من الشارة",
    "badge.verify_placeholder": "الصق رمز الشارة هنا...",
    "badge.verify": "تحقق من الشارة",
    "badge.verifying": "جاري التحقق...",
    "badge.verified": "تم التحقق",
    "badge.already_attended": "تم تسجيل الحضور مسبقاً",
    "badge.unknown_user": "مستخدم غير معروف",
    "badge.campaign": "الحملة",
    "badge.role_label": "الدور",
    "badge.presence_title": "التحقق من الحضور",
    "badge.scan_badge": "مسح الشارة",
    "badge.select_campaign": "اختر حملة",
    "badge.select_campaign_prompt": "اختر حملة لعرض المسجلين.",
    "badge.search_placeholder": "البحث عن متطوعين...",
    "badge.registered": "مسجلون",
    "badge.present": "حاضر",
    "badge.volunteer": "متطوع",
    "badge.status": "الحالة",
    "badge.mark_present": "تسجيل حضور",
    "badge.mark_absent": "إلغاء الحضور",
    "badge.attendance_updated": "تم تحديث الحضور",
    "badge.attendance_update_failed": "فشل تحديث الحضور",
    "badge.no_registrations": "لا توجد تسجيلات بعد.",
    "badge.paste_token": "لصق الرمز",
    "badge.scan_with_camera": "مسح بالكاميرا",
    "badge.camera_loading": "جاري تشغيل الكاميرا...",
    "badge.camera_not_found": "لم يتم العثور على كاميرا",

    "leaderboard.heading": "أفضل المتطوعين",
    "leaderboard.subheading": "نحتفي بالأشخاص الذين يجعلون مكناس أنظف، حملة تلو الأخرى.",
    "leaderboard.rank": "الترتيب",
    "leaderboard.points": "نقطة",
    "leaderboard.participants": "مشارك",
    "leaderboard.campaigns_attended": "حملة حضرها",
    "leaderboard.view_all": "عرض لوحة المتصدرين الكاملة",
    "leaderboard.empty": "لا يوجد متطوعون في لوحة المتصدرين بعد.",
    "leaderboard.loading": "جاري تحميل لوحة المتصدرين...",
    "leaderboard.period.all": "كل الأوقات",
    "leaderboard.period.year": "هذه السنة",
    "leaderboard.period.month": "هذا الشهر",
    "leaderboard.search_placeholder": "البحث عن متطوعين...",
    "leaderboard.no_search_results": "لا يوجد متطوعون مطابقون لبحثك.",
    "leaderboard.guest": "ضيف",

    "admin.leaderboard.title": "لوحة المتصدرين",
    "admin.leaderboard.award_points": "منح نقاط",
    "admin.leaderboard.select_user": "اختر متطوعاً",
    "admin.leaderboard.points": "النقاط",
    "admin.leaderboard.reason": "السبب",
    "admin.leaderboard.award": "منح",
    "admin.leaderboard.search": "البحث في لوحة المتصدرين...",
    "admin.leaderboard.points_system": "نظام النقاط",
    "admin.leaderboard.points_system_help": "حدد عدد النقاط التي يكتسبها المتطوعون تلقائياً عند التسجيل في حملة، وتأكيد حضورهم، ولكل كيلوغرام من النفايات التي يجمعها كل شخص. يتم تقسيم النفايات بالتساوي بين جميع الحاضرين في كل حملة.",
    "admin.leaderboard.points_registration": "نقاط لكل تسجيل",
    "admin.leaderboard.points_attendance": "نقاط لكل حضور",
    "admin.leaderboard.points_per_waste_kg": "نقاط لكل كغ من النفايات",
    "admin.leaderboard.save_points": "حفظ قيم النقاط",
    "admin.leaderboard.saving": "جاري الحفظ...",
    "admin.leaderboard.invalid_points": "يجب أن تكون قيم النقاط أرقام غير سالبة.",

    "toast.points_awarded": "تم منح النقاط",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string): string => {
      return translations[lang][key] || key;
    },
    [lang]
  );

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}


