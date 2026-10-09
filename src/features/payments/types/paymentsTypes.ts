export interface PayloadPatchPaymentsConfirmation {
  table: string;
  recordId: string;
  note: string | null;
}

export interface Payments {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
}

/** Modules whose fee can be switched off in Admin → Fee Management. */
export type PaymentsFeeModule = 'job' | 'project' | 'lms' | 'event';

/** The app_settings `*_fee_active` flags (migration 006). */
export interface DataPaymentsFeeSettings {
  job_fee_active: boolean;
  project_fee_active: boolean;
  lms_fee_active: boolean;
  event_fee_active: boolean;
}
