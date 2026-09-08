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
