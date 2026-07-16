import { getDb } from "../api/queries/connection";
import * as schema from "@db/schema";

async function seed() {
  const db = getDb();
  console.log("Creating tables...");

  // Access the underlying SQLite client for raw SQL
  const sqlite = (db as any).$client as any;

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unionId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch()),
      lastSignInAt INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_fr TEXT,
      title_ar TEXT,
      location_en TEXT NOT NULL,
      location_fr TEXT,
      location_ar TEXT,
      description_en TEXT NOT NULL,
      description_fr TEXT,
      description_ar TEXT,
      date TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      image TEXT,
      filter_tags TEXT NOT NULL DEFAULT 'all',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      is_replied INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS section_visibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL UNIQUE,
      is_visible INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  console.log("Seeding data...");

  // Insert sample campaigns
  const sampleCampaigns = [
    {
      titleEn: "Bab Mansour Cleanup",
      titleFr: "Nettoyage Bab Mansour",
      titleAr: "تنظيف باب المنصور",
      locationEn: "Bab Mansour, Meknes",
      locationFr: "Bab Mansour, Meknès",
      locationAr: "باب المنصور، مكناس",
      descriptionEn: "Join us for a community cleanup around the historic Bab Mansour gate. We'll be removing litter, planting flowers, and painting murals.",
      descriptionFr: "Rejoignez-nous pour un nettoyage communautaire autour de la porte historique Bab Mansour. Nous enlèverons les déchets, planterons des fleurs et peindrons des fresques.",
      descriptionAr: "انضم إلينا في حملة تنظيف مجتمعية حول باب المنصور التاريخي. سنقوم بإزالة النفايات وزراعة الزهور ورسم الجداريات.",
      date: "15 JUL 2025",
      slug: "bab-mansour-cleanup",
      image: "/assets/campaign-1.jpg",
      filterTags: "outdoor,community",
      isActive: true,
    },
    {
      titleEn: "Heri es-Souani River Clean",
      titleFr: "Nettoyage de la rivière Heri es-Souani",
      titleAr: "تنظيف نهر حري السواني",
      locationEn: "Heri es-Souani, Meknes",
      locationFr: "Heri es-Souani, Meknès",
      locationAr: "حري السواني، مكناس",
      descriptionEn: "Help us restore the beauty of the Heri es-Souani river area. Bring gloves and reusable bags. Refreshments provided!",
      descriptionFr: "Aidez-nous à restaurer la beauté de la zone de la rivière Heri es-Souani. Apportez des gants et des sacs réutilisables. Rafraîchissements fournis !",
      descriptionAr: "ساعدنا في استعادة جمال منطقة نهر حري السواني. أحضر قفازات وأكياس قابلة لإعادة الاستخدام. المشروبات متوفرة!",
      date: "22 JUL 2025",
      slug: "heri-essouani-river",
      image: "/assets/campaign-2.jpg",
      filterTags: "outdoor,water",
      isActive: true,
    },
    {
      titleEn: "Medina Plastic-Free Walk",
      titleFr: "Marche sans plastique de la Médina",
      titleAr: "مسيرة خالية من البلاستيك في المدينة",
      locationEn: "Old Medina, Meknes",
      locationFr: "Vieille Médina, Meknès",
      locationAr: "المدينة القديمة، مكناس",
      descriptionEn: "A awareness walk through the old Medina to promote plastic-free living. Distribute reusable bags to local shopkeepers.",
      descriptionFr: "Une marche de sensibilisation à travers la vieille Médina pour promouvoir une vie sans plastique. Distribuez des sacs réutilisables aux commerçants locaux.",
      descriptionAr: "مسيرة توعية عبر المدينة القديمة للترويج لحياة خالية من البلاستيك. قم بتوزيع أكياس قابلة لإعادة الاستخدام على أصحاب المحلات التجارية المحليين.",
      date: "05 AUG 2025",
      slug: "medina-plastic-free",
      image: "/assets/campaign-3.jpg",
      filterTags: "community,indoor",
      isActive: true,
    },
    {
      titleEn: "Bou Inania Garden Revival",
      titleFr: "Renaissance du jardin Bou Inania",
      titleAr: "إحياء حديقة بوعنانية",
      locationEn: "Bou Inania, Meknes",
      locationFr: "Bou Inania, Meknès",
      locationAr: "بوعنانية، مكناس",
      descriptionEn: "Revive the historic Bou Inania garden with new plants, composting workshops, and a community picnic.",
      descriptionFr: "Faites revivre le jardin historique Bou Inania avec de nouvelles plantes, des ateliers de compostage et un pique-nique communautaire.",
      descriptionAr: "أحيِ حديقة بوعنانية التاريخية بنباتات جديدة وورش عمل للسماد ونزهة مجتمعية.",
      date: "12 AUG 2025",
      slug: "bou-inania-garden",
      image: "/assets/campaign-4.jpg",
      filterTags: "outdoor,community",
      isActive: true,
    },
    {
      titleEn: "School Recycling Workshop",
      titleFr: "Atelier de recyclage scolaire",
      titleAr: "ورشة إعادة تدوير مدرسية",
      locationEn: "Lycée Moulay Ismail, Meknes",
      locationFr: "Lycée Moulay Ismail, Meknès",
      locationAr: "ثانوية مولاي إسماعيل، مكناس",
      descriptionEn: "Teach students about recycling through hands-on activities. Create art from waste materials and set up school recycling bins.",
      descriptionFr: "Apprenez aux élèves le recyclage par des activités pratiques. Créez de l'art à partir de déchets et installez des poubelles de recyclage scolaires.",
      descriptionAr: "علّم الطلاب إعادة التدوير من خلال أنشطة عملية. أنشئ فنًا من مواد النفايات وقم بإعداد صناديق إعادة تدوير مدرسية.",
      date: "20 AUG 2025",
      slug: "school-recycling",
      image: "/assets/campaign-5.jpg",
      filterTags: "indoor,education",
      isActive: true,
    },
    {
      titleEn: "Place el-Hedim Evening Clean",
      titleFr: "Nettoyage du soir Place el-Hedim",
      titleAr: "تنظيف مساء ساحل الحديم",
      locationEn: "Place el-Hedim, Meknes",
      locationFr: "Place el-Hedim, Meknès",
      locationAr: "ساحة الحديم، مكناس",
      descriptionEn: "Evening cleanup of the main square. Perfect for those who work during the day. Street lights and music included!",
      descriptionFr: "Nettoyage du soir de la place principale. Parfait pour ceux qui travaillent pendant la journée. Éclairage de rue et musique inclus !",
      descriptionAr: "تنظيف مسائي للساحة الرئيسية. مثالي لأولئك الذين يعملون خلال النهار. أضواء الشوارع والموسيقى متضمنة!",
      date: "28 AUG 2025",
      slug: "place-elhedim-evening",
      image: "/assets/campaign-6.jpg",
      filterTags: "outdoor,community",
      isActive: true,
    },
  ];

  for (const campaign of sampleCampaigns) {
    try {
      db.insert(schema.campaigns).values(campaign).run();
    } catch {
      // may already exist
    }
  }

  console.log(`Inserted ${sampleCampaigns.length} campaigns.`);

  // Insert default section visibility settings
  const sections = [
    { sectionKey: "hero", isVisible: true },
    { sectionKey: "impact", isVisible: true },
    { sectionKey: "about", isVisible: true },
    { sectionKey: "neighborhoods", isVisible: true },
    { sectionKey: "testimonials", isVisible: true },
    { sectionKey: "gallery", isVisible: true },
    { sectionKey: "sponsors", isVisible: true },
    { sectionKey: "socialFeed", isVisible: true },
    { sectionKey: "howToJoin", isVisible: true },
    { sectionKey: "faq", isVisible: true },
    { sectionKey: "campaigns", isVisible: true },
    { sectionKey: "contact", isVisible: true },
    { sectionKey: "donation", isVisible: false },
    { sectionKey: "airQuality", isVisible: true },
    { sectionKey: "poll", isVisible: true },
  ];
  for (const section of sections) {
    try {
      db.insert(schema.sectionVisibility).values(section).run();
    } catch {
      // may already exist
    }
  }
  console.log(`Inserted ${sections.length} section visibility defaults.`);

  // Insert default site settings
  const defaultSettings = [
    { key: "stat_campaigns", value: "40" },
    { key: "stat_volunteers", value: "800" },
    { key: "stat_neighborhoods", value: "12" },

    { key: "contact_email", value: "contact@greenmeknes.ma" },
    { key: "contact_phone", value: "+212 5 35 52 12 34" },
    { key: "social_whatsapp", value: "https://wa.me/212600000000" },
    { key: "social_instagram", value: "https://instagram.com/greenmeknes" },
    { key: "donation_title_fr", value: "Soutenez Notre Mission" },
    { key: "donation_title_ar", value: "ادعم مهمتنا" },
    { key: "donation_description_fr", value: "Votre contribution nous aide a organiser plus de nettoyages et a sensibiliser les gens a travers Meknes." },
    { key: "donation_description_ar", value: "مساهمتك تساعدنا في تنظيم المزيد من حملات التنظيف ونشر الوعي في جميع أنحاء مكناس." },
    { key: "footer_tagline_fr", value: "Rues Plus Propres. Parcs Plus Verts. Communaute Plus Forte." },
    { key: "footer_tagline_ar", value: "شوارع أنظف. حدائق أخضر. مجتمع أقوى." },
    { key: "footer_copyright_fr", value: "2025 Green Clean Meknes. Tous droits reserves." },
    { key: "footer_copyright_ar", value: "2025 جرين مكناس. جميع الحقوق محفوظة." },
    { key: "social_show_instagram", value: "true" },
    { key: "social_show_facebook", value: "true" },
    { key: "footer_tagline", value: "Building a cleaner, greener Meknes — one neighborhood at a time." },
    { key: "footer_copyright", value: "Green Meknes. All rights reserved." },
    { key: "donation_title", value: "Support Our Mission" },
    { key: "donation_description", value: "Your contribution helps us organize more cleanups and spread awareness across Meknes." },
    { key: "donation_bank_name", value: "Bank of Africa" },
    { key: "donation_rib", value: "007 999 0001234567890123 45" },
    { key: "donation_paypal", value: "" },
    { key: "donation_iban", value: "MA64 0079 9900 0123 4567 8901 2345" },
    { key: "donation_swift", value: "BMCEMAMC" },
    { key: "donation_account_holder", value: "Green Clean Meknes Association" },
  ];
  for (const setting of defaultSettings) {
    try {
      db.insert(schema.siteSettings).values(setting).run();
    } catch {
      // may already exist
    }
  }
  console.log(`Inserted ${defaultSettings.length} site settings defaults.`);

  // Insert sample testimonials
  const sampleTestimonials = [
    {
      name: "Youssef El Amrani",
      nameAr: "يوسف العمراني",
      nameFr: "Youssef El Amrani",
      role: "Volunteer since 2023",
      roleAr: "متطوع منذ 2023",
      roleFr: "Benevole depuis 2023",
      quoteEn: "Joining Green Clean Meknes changed how I see my city. I used to walk past litter without noticing. Now I stop and pick it up. The community we built is incredible.",
      quoteAr: "غيرت مكناس الخضراء النظيفة طريقة رؤيتي لمدينتي. كنت أمشي بجانب القمامة دون ملاحظتها. الآن أتوقف وألتقطها. المجتمع الذي بنيناه لا يصدق.",
      quoteFr: "Rejoindre Green Clean Meknes a change ma facon de voir ma ville. Avant, je marchais devant les dechets sans les remarquer. Maintenant, je m'arrete et je les ramasse. La communaute que nous avons construite est incroyable.",
      sortOrder: 0,
      isActive: true,
    },
    {
      name: "Fatima Zahra Bennani",
      nameAr: "فاطمة الزهراء بناني",
      nameFr: "Fatima Zahra Bennani",
      role: "Neighborhood Coordinator",
      roleAr: "منسقة الحي",
      roleFr: "Coordinatrice de quartier",
      quoteEn: "I organized my first cleanup in Hamria with just 5 friends. Now we have 40+ people showing up every month. The transformation of our streets is visible to everyone.",
      quoteAr: "نظمت أول حملة تنظيف لي في الحمريّة مع 5 أصدقاء فقط. الآن لدينا 40+ شخص يحضرون كل شهر. تحول شوارعنا واضح للجميع.",
      quoteFr: "J'ai organise ma premiere campagne de nettoyage a Hamria avec seulement 5 amis. Maintenant, nous avons plus de 40 personnes qui se presentent chaque mois. La transformation de nos rues est visible pour tout le monde.",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Karim Idrissi",
      nameAr: "كريم الإدريسي",
      nameFr: "Karim Idrissi",
      role: "Student, ENSEM Meknes",
      roleAr: "طالب، المدرسة الوطنية العليا للإلكترونيك بمكناس",
      roleFr: "Etudiant, ENSEM Meknes",
      quoteEn: "As an engineering student, I wanted to do something practical for my city. The data we collect on waste types helps us understand pollution patterns. It's science in action.",
      quoteAr: "كطالب هندسة، أردت أن أفعل شيئًا عمليًا لمدينتي. البيانات التي نجمعها عن أنواع النفايات تساعدنا في فهم أنماط التلوث. إنها العلم في العمل.",
      quoteFr: "En tant qu'etudiant en ingenierie, je voulais faire quelque chose de pratique pour ma ville. Les donnees que nous collectons sur les types de dechets nous aident a comprendre les modeles de pollution. C'est la science en action.",
      sortOrder: 2,
      isActive: true,
    },
  ];
  for (const testimonial of sampleTestimonials) {
    try {
      db.insert(schema.testimonials).values(testimonial).run();
    } catch {
      // may already exist
    }
  }
  console.log(`Inserted ${sampleTestimonials.length} testimonials.`);

  // Insert default poll
  try {
    db.insert(schema.polls).values({
      question: "What area of Meknes needs cleaning most?",
      questionAr: "ما هي منطقة مكناس التي تحتاج إلى التنظيف أكثر؟",
      questionFr: "Quelle zone de Meknès a le plus besoin d'être nettoyée ?",
      options: JSON.stringify(["Old Medina", "Place el-Hedim", "Fert River Banks", "Residential Neighborhoods", "Public Parks"]),
      optionsAr: JSON.stringify(["المدينة القديمة", "ساحة الحديم", "ضفاف نهر فرت", "الأحياء السكنية", "الحدائق العامة"]),
      optionsFr: JSON.stringify(["Vieille Médina", "Place el-Hedim", "Bords de la rivière Fert", "Quartiers résidentiels", "Parcs publics"]),
      isActive: true,
    }).run();
    console.log("Inserted default poll.");
  } catch {
    // may already exist
  }

  // Insert default FAQs
  const sampleFaqs = [
    {
      questionEn: "Do I need to bring anything?",
      questionFr: "Dois-je apporter quelque chose ?",
      questionAr: "هل أحتاج إلى إحضار أي شيء؟",
      answerEn: "We provide gloves, trash bags, and basic tools. Just bring water, comfortable clothes, and your enthusiasm!",
      answerFr: "Nous fournissons des gants, des sacs poubelles et des outils de base. Apportez juste de l'eau, des vêtements confortables et votre enthousiasme !",
      answerAr: "نوفر القفازات وأكياس القمامة والأدوات الأساسية. فقط أحضر الماء والملابس المريحة وحماستك!",
      sortOrder: 1,
      isActive: true,
    },
    {
      questionEn: "Is there an age limit?",
      questionFr: "Y a-t-il une limite d'âge ?",
      questionAr: "هل هناك حد عمر؟",
      answerEn: "Volunteers of all ages are welcome! Children under 16 should be accompanied by an adult. We have tasks suitable for everyone.",
      answerFr: "Les bénévoles de tous âges sont les bienvenus ! Les enfants de moins de 16 ans doivent être accompagnés d'un adulte. Nous avons des tâches adaptées à tout le monde.",
      answerAr: "المتطوعون من جميع الأعمار مرحب بهم! يجب أن يكون الأطفال دون 16 عامًا برفقة شخص بالغ. لدينا مهام مناسبة للجميع.",
      sortOrder: 2,
      isActive: true,
    },
    {
      questionEn: "How long do campaigns last?",
      questionFr: "Combien de temps durent les campagnes ?",
      questionAr: "كم تستمر الحملات؟",
      answerEn: "Most campaigns last 2-4 hours, typically on weekend mornings. We always announce the exact duration when you register.",
      answerFr: "La plupart des campagnes durent 2 à 4 heures, généralement le matin en week-end. Nous annonçons toujours la durée exacte lors de votre inscription.",
      answerAr: "تستمر معظم الحملات من 2 إلى 4 ساعات، عادة في صباحات عطلة نهاية الأسبوع. نعلن دائمًا عن المدة الدقيقة عند تسجيلك.",
      sortOrder: 3,
      isActive: true,
    },
    {
      questionEn: "Can I organize a campaign in my neighborhood?",
      questionFr: "Puis-je organiser une campagne dans mon quartier ?",
      questionAr: "هل يمكنني تنظيم حملة في حيّي؟",
      answerEn: "Absolutely! Contact us through the form below and we'll help you plan and promote a cleanup in your area.",
      answerFr: "Absolument ! Contactez-nous via le formulaire ci-dessous et nous vous aiderons à planifier et promouvoir un nettoyage dans votre quartier.",
      answerAr: "بالتأكيد! تواصل معنا عبر النموذج أدناه وسنساعدك في التخطيط والترويج لحملة تنظيف في منطقتك.",
      sortOrder: 4,
      isActive: true,
    },
    {
      questionEn: "Is it safe to volunteer?",
      questionFr: "Est-il sûr de faire du bénévolat ?",
      questionAr: "هل التطوع آمن؟",
      answerEn: "Yes, safety is our priority. We provide safety briefings, first aid kits, and never work in dangerous areas. All volunteers are covered by our insurance.",
      answerFr: "Oui, la sécurité est notre priorité. Nous fournissons des briefings de sécurité, des trousses de premiers secours et ne travaillons jamais dans des zones dangereuses. Tous les bénévoles sont couverts par notre assurance.",
      answerAr: "نعم، السلامة هي أولويتنا. نقدم إحاطات أمنية وحقائب إسعافات أولية ولا نعمل أبدًا في مناطق خطرة. جميع المتطوعين مغطيون بتأميننا.",
      sortOrder: 5,
      isActive: true,
    },
  ];
  for (const faq of sampleFaqs) {
    try {
      db.insert(schema.faqs).values(faq).run();
    } catch {
      // may already exist
    }
  }
  console.log(`Inserted ${sampleFaqs.length} FAQs.`);

  // Create new tables if not exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      label_en TEXT NOT NULL,
      label_fr TEXT,
      label_ar TEXT,
      permissions TEXT NOT NULL,
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS section_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT,
      created_by INTEGER NOT NULL,
      assigned_to INTEGER,
      target_date INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS plan_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS social_feed_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      post_url TEXT NOT NULL,
      embed_code TEXT,
      image_url TEXT,
      caption_en TEXT,
      caption_fr TEXT,
      caption_ar TEXT,
      author_name TEXT,
      posted_at INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  console.log("Created new dashboard tables.");

  // Seed default user roles
  const defaultRoles = [
    { name: "super_admin", labelEn: "Super Admin", labelFr: "Super Admin", labelAr: "المشرف الأعلى", permissions: JSON.stringify(["*"]), isSystem: true },
    { name: "admin", labelEn: "Admin", labelFr: "Administrateur", labelAr: "مشرف", permissions: JSON.stringify(["dashboard.view","users.view","users.manage","campaigns.view","campaigns.manage","contacts.view","contacts.manage","sections.view","sections.manage","settings.view","settings.manage","neighborhoods.view","neighborhoods.manage","faqs.view","faqs.manage","testimonials.view","testimonials.manage","polls.view","polls.manage","plans.view","plans.manage","activity_logs.view"]), isSystem: true },
    { name: "content_manager", labelEn: "Content Manager", labelFr: "Gestionnaire de Contenu", labelAr: "مدير المحتوى", permissions: JSON.stringify(["dashboard.view","campaigns.view","campaigns.manage","sections.view","sections.manage","neighborhoods.view","neighborhoods.manage","faqs.view","faqs.manage","testimonials.view","testimonials.manage","polls.view","polls.manage"]), isSystem: true },
    { name: "volunteer_coordinator", labelEn: "Volunteer Coordinator", labelFr: "Coordinateur de Bénévoles", labelAr: "منسق المتطوعين", permissions: JSON.stringify(["dashboard.view","campaigns.view","contacts.view","contacts.manage","users.view","plans.view"]), isSystem: true },
    { name: "viewer", labelEn: "Viewer", labelFr: "Lecteur", labelAr: "مشاهد", permissions: JSON.stringify(["dashboard.view","users.view","campaigns.view","contacts.view","sections.view","settings.view","neighborhoods.view","faqs.view","testimonials.view","polls.view","plans.view","activity_logs.view"]), isSystem: true },
  ];
  for (const role of defaultRoles) {
    try {
      db.insert(schema.userRoles).values(role).run();
    } catch {
      // may already exist
    }
  }
  console.log(`Inserted ${defaultRoles.length} default roles.`);

  // Seed default section order
  const sectionOrders = [
    { sectionKey: "hero", sortOrder: 0 },
    { sectionKey: "impact", sortOrder: 1 },
    { sectionKey: "about", sortOrder: 2 },
    { sectionKey: "neighborhoods", sortOrder: 3 },
    { sectionKey: "testimonials", sortOrder: 4 },
    { sectionKey: "gallery", sortOrder: 5 },
    { sectionKey: "socialFeed", sortOrder: 6 },
    { sectionKey: "sponsors", sortOrder: 6 },
    { sectionKey: "howToJoin", sortOrder: 7 },
    { sectionKey: "faq", sortOrder: 7 },
    { sectionKey: "campaigns", sortOrder: 8 },
    { sectionKey: "contact", sortOrder: 9 },
    { sectionKey: "donation", sortOrder: 10 },
    { sectionKey: "airQuality", sortOrder: 11 },
    { sectionKey: "poll", sortOrder: 12 },
  ];
  for (const so of sectionOrders) {
    try {
      db.insert(schema.sectionOrder).values(so).run();
    } catch {
      // may already exist
    }
  }
  console.log(`Inserted ${sectionOrders.length} section order defaults.`);

  // Seed sample social feed posts
  const sampleSocialPosts = [
    {
      platform: "instagram",
      postUrl: "https://instagram.com/greenmeknes",
      imageUrl: "/assets/campaign-bab-mansour.jpg",
      captionEn: "Amazing turnout at Bab Mansour cleanup! 50+ volunteers made a real difference.",
      captionFr: "Incroyable participation au nettoyage de Bab Mansour ! Plus de 50 bénévoles ont fait la différence.",
      captionAr: "مشاركة رائعة في حملة تنظيف باب المنصور! أكثر من 50 متطوع أحدثوا فرقًا حقيقيًا.",
      authorName: "@greenmeknes",
      sortOrder: 0,
      isActive: true,
    },
    {
      platform: "tiktok",
      postUrl: "https://tiktok.com/@greenmeknes",
      imageUrl: "/assets/campaign-hamria.jpg",
      captionEn: "Before and after at Hamria district. The transformation is incredible!",
      captionFr: "Avant et après dans le quartier Hamria. La transformation est incroyable !",
      captionAr: "قبل وبعد في حي الحامريّة. التحول لا يصدق!",
      authorName: "@greenmeknes",
      sortOrder: 1,
      isActive: true,
    },
    {
      platform: "facebook",
      postUrl: "https://facebook.com/greenmeknes",
      imageUrl: "/assets/campaign-ville-nouvelle.jpg",
      captionEn: "Tree planting day in Ville Nouvelle. 120 new trees for a greener Meknes!",
      captionFr: "Journée de plantation d'arbres à la Ville Nouvelle. 120 nouveaux arbres pour un Meknès plus vert !",
      captionAr: "يوم زراعة الأشجار في المدينة الجديدة. 120 شجرة جديدة لمكناس أكثر خضرة!",
      authorName: "Green Meknes",
      sortOrder: 2,
      isActive: true,
    },
  ];
  for (const post of sampleSocialPosts) {
    try {
      db.insert(schema.socialFeedPosts).values(post as any).run();
    } catch {
      // may already exist
    }
  }
  console.log(`Inserted ${sampleSocialPosts.length} sample social feed posts.`);

  console.log("Done.");
  process.exit(0);
}

seed();
