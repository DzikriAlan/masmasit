export interface PayloadPostAuthPasswordReset {
  email: string;
  redirectTo: string;
}

export interface PayloadPatchAuthPassword {
  password: string;
}

export interface DataAuthProfile {
  full_name: string | null;
  bio: string | null;
}

export interface Auth {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataAuthProfile | null;
}
