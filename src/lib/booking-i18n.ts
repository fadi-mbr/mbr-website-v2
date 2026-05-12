/**
 * Booking flow i18n — EN + AR strings.
 *
 * Same key → both languages. Translate as a pair; do not let one drift.
 * Date / time formatting uses Intl.DateTimeFormat with the lang argument
 * so we do not duplicate format strings here.
 */

export type Lang = 'en' | 'ar';

export const LANG_STORAGE_KEY = 'mbr_lang';

export const isRtl = (lang: Lang): boolean => lang === 'ar';

const strings = {
  // Page chrome
  eyebrow:         { en: 'Book Your Service',                       ar: 'احجز خدمتك' },
  pageTitle:       { en: 'Book your service',                       ar: 'احجز خدمتك' },
  pageIntro:       {
    en: 'Pick a service, choose a slot, and we will confirm right away. Prefer to chat? The buttons below open WhatsApp or place a call.',
    ar: 'اختر خدمة وحدد موعدًا وسنؤكده فورًا. تفضّل المحادثة؟ الأزرار أدناه تفتح واتساب أو تجري مكالمة.',
  },
  chatToBook:      { en: 'Chat to book',                            ar: 'احجز عبر المحادثة' },
  callShop:        { en: 'Call +971 56 501 5800',                   ar: 'اتصل على +971 56 501 5800' },
  fallbackNote:    {
    en: 'Prefer not to fill the form? Chat or call — both reach our team instantly during working hours.',
    ar: 'تفضّل عدم تعبئة النموذج؟ تواصل عبر المحادثة أو الهاتف — كلاهما يصل لفريقنا فورًا خلال ساعات العمل.',
  },

  // Stepper
  stepIndicator:   { en: 'Step {n} of 5',                           ar: 'الخطوة {n} من 5' },
  stepLabelService:{ en: 'Service',                                 ar: 'الخدمة' },
  stepLabelDate:   { en: 'Date',                                    ar: 'التاريخ' },
  stepLabelTime:   { en: 'Time',                                    ar: 'الوقت' },
  stepLabelDetails:{ en: 'Details',                                 ar: 'التفاصيل' },
  stepLabelDone:   { en: 'Done',                                    ar: 'تم' },

  // Step 1 — Service
  step1Heading:    { en: 'Pick a service',                          ar: 'اختر الخدمة' },
  step1Hint:       { en: 'Tap a service to select. You can change this later if needed.', ar: 'اضغط على خدمة لاختيارها. يمكنك تغييرها لاحقًا عند الحاجة.' },
  servicesLoading: { en: 'Loading services…',                       ar: 'جارٍ تحميل الخدمات…' },
  servicesError:   { en: 'We could not load services. Try again or chat to book.', ar: 'تعذّر تحميل الخدمات. أعد المحاولة أو تواصل عبر المحادثة.' },
  retry:           { en: 'Try again',                               ar: 'إعادة المحاولة' },
  duration1h:      { en: '1 h',                                     ar: 'ساعة' },
  durationHours:   { en: '{n} h',                                   ar: '{n} ساعات' },
  priceAed:        { en: 'AED {price}',                             ar: '{price} د.إ' },

  // Step 2 — Date
  step2Heading:    { en: 'When works for you?',                     ar: 'متى يناسبك؟' },
  step2Hint:       { en: 'Next 14 days. Sundays are closed.',       ar: 'الأيام الـ14 القادمة. مغلق أيام الأحد.' },
  today:           { en: 'Today',                                   ar: 'اليوم' },
  tomorrow:        { en: 'Tomorrow',                                ar: 'غدًا' },
  closedSunday:    { en: 'Closed',                                  ar: 'مغلق' },

  // Step 3 — Time
  step3Heading:    { en: 'Pick a time',                             ar: 'اختر الوقت' },
  slotsLoading:    { en: 'Loading slots for {date}…',               ar: 'جارٍ تحميل المواعيد لـ{date}…' },
  slotsEmpty:      { en: 'No availability for that date — try another.', ar: 'لا تتوفر مواعيد في هذا اليوم — جرّب يومًا آخر.' },
  slotsError:      { en: 'Could not load slots. Retry or chat to book.', ar: 'تعذّر تحميل المواعيد. أعد المحاولة أو تواصل عبر المحادثة.' },
  changeDate:      { en: 'Change date',                             ar: 'غيّر التاريخ' },

  // Step 4 — Details
  step4Heading:    { en: 'Last step — your details',                ar: 'الخطوة الأخيرة — بياناتك' },
  firstName:       { en: 'First name',                              ar: 'الاسم الأول' },
  lastName:        { en: 'Last name',                               ar: 'اسم العائلة' },
  phone:           { en: 'Mobile phone',                            ar: 'رقم الجوال' },
  phonePlaceholder:{ en: '+971 50 123 4567',                        ar: '+971 50 123 4567' },
  phoneHint:       { en: 'We use this for the booking confirmation on WhatsApp.', ar: 'نستخدمه لتأكيد الحجز عبر واتساب.' },
  email:           { en: 'Email',                                   ar: 'البريد الإلكتروني' },
  vehicleMake:     { en: 'Vehicle make',                            ar: 'صانع السيارة' },
  vehicleModel:    { en: 'Vehicle model',                           ar: 'طراز السيارة' },
  vehicleYear:     { en: 'Year',                                    ar: 'السنة' },
  vehicleTrim:     { en: 'Trim (optional)',                         ar: 'الفئة (اختياري)' },
  mileage:         { en: 'Mileage in km (optional)',                ar: 'الكيلومترات (اختياري)' },
  concernLabel:    { en: 'Tell us what is going on (optional)',     ar: 'صف ما يحدث (اختياري)' },
  concernPlaceholder: {
    en: 'e.g. dashboard warning light, soft brake pedal, suspension noise…',
    ar: 'مثال: إضاءة تحذير، فرامل متراخية، صوت في التعليق…',
  },
  charsCount:      { en: '{n}/500',                                 ar: '{n}/500' },
  required:        { en: 'Required',                                ar: 'مطلوب' },
  invalidEmail:    { en: 'Please enter a valid email',              ar: 'يرجى إدخال بريد إلكتروني صحيح' },
  invalidPhone:    { en: 'Enter a UAE mobile number, e.g. 050 123 4567', ar: 'أدخل رقم جوال إماراتي، مثال: 050 123 4567' },
  invalidYear:     { en: 'Enter a year between 1980 and next year', ar: 'أدخل سنة بين 1980 والسنة المقبلة' },
  confirmBooking:  { en: 'Confirm booking',                         ar: 'تأكيد الحجز' },
  submitting:      { en: 'Confirming…',                             ar: 'جارٍ التأكيد…' },

  // Errors from API
  errSlotTaken:    { en: 'That slot was just booked — pick another time.', ar: 'تم حجز هذا الوقت للتو — اختر وقتًا آخر.' },
  errRateLimit:    { en: 'You booked recently — please wait a minute and try again.', ar: 'لقد حجزت مؤخرًا — انتظر دقيقة وحاول مرة أخرى.' },
  errArcDown:      { en: 'We could not book online. Chat to book instantly.', ar: 'تعذّر الحجز عبر الإنترنت. تواصل عبر المحادثة لحجز فوري.' },
  errPhoneProblem: { en: 'We could not verify that phone number. Try another, or chat to book.', ar: 'تعذّر التحقق من رقم الهاتف. جرّب رقمًا آخر أو تواصل عبر المحادثة.' },
  errGeneric:      { en: 'Something went wrong. Try again or chat to book.', ar: 'حدث خطأ. أعد المحاولة أو تواصل عبر المحادثة.' },

  // Step 5 — Confirmation
  step5Heading:    { en: 'You are booked!',                         ar: 'تم تأكيد حجزك!' },
  confirmedSub:    { en: 'We sent a copy to your email and will WhatsApp a reminder the day before.', ar: 'أرسلنا نسخة إلى بريدك، وسنرسل تذكيرًا عبر واتساب قبل الموعد بيوم.' },
  yourService:     { en: 'Your service',                            ar: 'خدمتك' },
  yourDate:        { en: 'Date',                                    ar: 'التاريخ' },
  yourTime:        { en: 'Time',                                    ar: 'الوقت' },
  yourAddress:     { en: 'Address',                                 ar: 'العنوان' },
  addressLine:     { en: '16 8 St Al Quoz Industrial 4, Dubai, UAE', ar: '١٦ شارع ٨، القوز الصناعية ٤، دبي، الإمارات' },
  saveToCal:       { en: 'Save to calendar',                        ar: 'حفظ في التقويم' },
  modifyOnWa:      { en: 'Modify via WhatsApp',                     ar: 'تعديل عبر واتساب' },
  reminderNote:    { en: 'We will WhatsApp you a reminder the day before. Reply to that message any time to reschedule.', ar: 'سنرسل تذكيرًا عبر واتساب قبل الموعد بيوم. ردّ على الرسالة في أي وقت لإعادة الجدولة.' },
  bookAnother:     { en: 'Book another service',                    ar: 'احجز خدمة أخرى' },

  // Buttons / nav
  continue:        { en: 'Continue',                                ar: 'متابعة' },
  back:            { en: 'Back',                                    ar: 'رجوع' },
  langLabel:       { en: 'العربية',                                  ar: 'English' },
} as const satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof strings;

/**
 * Translator. Supports `{name}` style placeholders.
 *
 *   t('stepIndicator', 'en', { n: 2 }) → 'Step 2 of 5'
 */
export function t(
  key: StringKey,
  lang: Lang,
  vars?: Record<string, string | number>
): string {
  const tpl: string = strings[key]?.[lang] ?? strings[key]?.en ?? String(key);
  if (!vars) return tpl;
  return Object.entries(vars).reduce<string>(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    tpl
  );
}

/** Format a number with the right locale digits (Arabic-Indic for AR). */
export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-AE' : 'en-AE').format(n);
}

/** Read persisted language preference from localStorage, defaulting to 'en'. */
export function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const v = window.localStorage.getItem(LANG_STORAGE_KEY);
  return v === 'ar' ? 'ar' : 'en';
}

export function writeStoredLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LANG_STORAGE_KEY, lang);
}
