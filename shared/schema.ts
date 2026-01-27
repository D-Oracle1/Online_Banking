import { pgTable, text, varchar, decimal, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';

// Pending registrations - stores data before email verification
export const pendingRegistrations = pgTable('pending_registrations', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  username: text('username').notNull(),
  password: text('password').notNull(), // hashed
  fullName: text('full_name').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 10 }),
  nationality: varchar('nationality', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
  occupation: varchar('occupation', { length: 100 }),
  employer: varchar('employer', { length: 200 }),
  annualIncome: varchar('annual_income', { length: 50 }),
  profilePhoto: text('profile_photo'),
  emailOtp: varchar('email_otp', { length: 10 }).notNull(),
  otpExpiresAt: timestamp('otp_expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Auto-delete after 24 hours
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 10 }),
  nationality: varchar('nationality', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
  occupation: varchar('occupation', { length: 100 }),
  employer: varchar('employer', { length: 200 }),
  annualIncome: varchar('annual_income', { length: 50 }),
  profilePhoto: text('profile_photo'),
  idType: varchar('id_type', { length: 50 }),
  idNumber: varchar('id_number', { length: 100 }),
  idDocument: text('id_document'),
  emailOtp: varchar('email_otp', { length: 10 }),
  otpExpiresAt: timestamp('otp_expires_at'),
  twoFactorToken: varchar('two_factor_token', { length: 6 }),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at'),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  isSuperAdmin: boolean('is_super_admin').notNull().default(false),
  hasSeenWelcome: boolean('has_seen_welcome').notNull().default(false),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  lastActiveAt: timestamp('last_active_at'),
  isTyping: boolean('is_typing').notNull().default(false),
  amlCode: varchar('aml_code', { length: 10 }),
  amlCodeExpiresAt: timestamp('aml_code_expires_at'),
  twoFACode: varchar('two_fa_code', { length: 20 }),
  twoFACodeExpiresAt: timestamp('two_fa_code_expires_at'),
  unlockCode: varchar('unlock_code', { length: 20 }),
  unlockCodeExpiresAt: timestamp('unlock_code_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  accountNumber: text('account_number').unique().notNull(),
  accountType: varchar('account_type', { length: 50 }).notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
  isActivated: boolean('is_activated').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('SUCCESS'),
  description: text('description'),
  recipientAccountNumber: text('recipient_account_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const loans = pgTable('loans', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  purpose: text('purpose').notNull(),
  term: integer('term').notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }),
  totalRepayment: decimal('total_repayment', { precision: 15, scale: 2 }),
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const fixedSavings = pgTable('fixed_savings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).notNull(),
  term: integer('term').notNull(),
  maturityDate: timestamp('maturity_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const stockPortfolios = pgTable('stock_portfolios', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  totalInvested: decimal('total_invested', { precision: 15, scale: 2 }).notNull().default('0.00'),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).notNull().default('0.00'),
  totalProfitLoss: decimal('total_profit_loss', { precision: 15, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // ACTIVE, CLOSED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const stockHoldings = pgTable('stock_holdings', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => stockPortfolios.id),
  symbol: varchar('symbol', { length: 10 }).notNull(), // Stock ticker symbol (e.g., AAPL, MSFT)
  companyName: varchar('company_name', { length: 200 }).notNull(),
  shares: decimal('shares', { precision: 15, scale: 6 }).notNull(), // Support fractional shares
  averagePurchasePrice: decimal('average_purchase_price', { precision: 15, scale: 2 }).notNull(),
  totalInvested: decimal('total_invested', { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 15, scale: 2 }).notNull().default('0.00'),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).notNull().default('0.00'),
  profitLoss: decimal('profit_loss', { precision: 15, scale: 2 }).notNull().default('0.00'),
  profitLossPercent: decimal('profit_loss_percent', { precision: 10, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const stockTransactions = pgTable('stock_transactions', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => stockPortfolios.id),
  userId: text('user_id').notNull().references(() => users.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  type: varchar('type', { length: 10 }).notNull(), // BUY, SELL
  symbol: varchar('symbol', { length: 10 }).notNull(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  shares: decimal('shares', { precision: 15, scale: 6 }).notNull(),
  pricePerShare: decimal('price_per_share', { precision: 15, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('SUCCESS'), // SUCCESS, FAILED, PENDING
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const stockWatchlist = pgTable('stock_watchlist', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  addedPrice: decimal('added_price', { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 15, scale: 2 }).notNull().default('0.00'),
  priceChange: decimal('price_change', { precision: 15, scale: 2 }).notNull().default('0.00'),
  priceChangePercent: decimal('price_change_percent', { precision: 10, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Can be guest ID or actual user ID
  message: text('message').notNull(),
  attachment: text('attachment'),
  response: text('response'),
  isRead: boolean('is_read').notNull().default(false),
  senderType: text('sender_type').notNull().default('user'), // 'user' or 'admin'
  sentBy: text('sent_by'), // admin user ID if sent by admin, or guest name
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp - null means not deleted
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactionPins = pgTable('transaction_pins', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  pinHash: text('pin_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey(),

  // Logo & Icons
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  splashLogoUrl: text('splash_logo_url'),
  appIconUrl: text('app_icon_url'),

  // Brand Colors
  primaryColor: varchar('primary_color', { length: 7 }).notNull().default('#1e3a8a'), // blue-900
  secondaryColor: varchar('secondary_color', { length: 7 }).notNull().default('#10b981'), // green-500
  accentColor: varchar('accent_color', { length: 7 }).notNull().default('#ef4444'), // red-500

  // Background Colors
  backgroundLight: varchar('background_light', { length: 7 }).notNull().default('#ffffff'),
  backgroundDark: varchar('background_dark', { length: 7 }).notNull().default('#f9fafb'),

  // Text Colors
  textPrimary: varchar('text_primary', { length: 7 }).notNull().default('#111827'),
  textSecondary: varchar('text_secondary', { length: 7 }).notNull().default('#6b7280'),
  textMuted: varchar('text_muted', { length: 7 }).notNull().default('#9ca3af'),

  // Button Colors
  buttonPrimary: varchar('button_primary', { length: 7 }).notNull().default('#1e3a8a'),
  buttonSecondary: varchar('button_secondary', { length: 7 }).notNull().default('#64748b'),
  buttonSuccess: varchar('button_success', { length: 7 }).notNull().default('#10b981'),
  buttonWarning: varchar('button_warning', { length: 7 }).notNull().default('#f59e0b'),
  buttonDanger: varchar('button_danger', { length: 7 }).notNull().default('#ef4444'),

  // Border & UI Colors
  borderColor: varchar('border_color', { length: 7 }).notNull().default('#e5e7eb'),
  shadowColor: varchar('shadow_color', { length: 7 }).notNull().default('#000000'),

  // Site Information
  bankName: varchar('bank_name', { length: 200 }).notNull().default('Online Banking'),
  tagline: text('tagline'),
  supportEmail: varchar('support_email', { length: 200 }),
  supportPhone: varchar('support_phone', { length: 50 }),
  address: text('address'),
  copyrightText: varchar('copyright_text', { length: 500 }),

  // Social Media Links
  facebookUrl: varchar('facebook_url', { length: 500 }),
  twitterUrl: varchar('twitter_url', { length: 500 }),
  instagramUrl: varchar('instagram_url', { length: 500 }),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),

  // System Settings
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  registrationEnabled: boolean('registration_enabled').notNull().default(true),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by').references(() => users.id),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id),
  darkMode: boolean('dark_mode').notNull().default(false),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  smsNotifications: boolean('sms_notifications').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const debitCards = pgTable('debit_cards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  cardNumber: text('card_number').notNull(),
  cvv: text('cvv').notNull(),
  expiryDate: text('expiry_date').notNull(),
  cardholderName: text('cardholder_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const debitCardPins = pgTable('debit_card_pins', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => debitCards.id),
  pinHash: text('pin_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const deposits = pgTable('deposits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentProof: text('payment_proof'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey(),
  key: text('key').unique().notNull(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailOtps = pgTable('email_otps', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  otp: text('otp').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const loanRepayments = pgTable('loan_repayments', {
  id: text('id').primaryKey(),
  loanId: text('loan_id').notNull().references(() => loans.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentProof: text('payment_proof'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const amlAlerts = pgTable('aml_alerts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  description: text('description').notNull(),
  transactionId: text('transaction_id'),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  reviewedBy: text('reviewed_by'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  deletedAt: timestamp('deleted_at'), // Soft-delete timestamp
  deletedBy: text('deleted_by'), // Admin user ID who performed the deletion
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Can be user ID, admin ID, or guest ID
  type: varchar('type', { length: 50 }).notNull(), // 'chat_message', 'user_registration', 'account_activity', 'system_alert'
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: text('data'), // JSON string for additional data
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Can be user ID, admin ID, or guest ID
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
