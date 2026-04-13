export type OnboardingActionState = {
  error?: string;
  fieldErrors?: {
    workspaceName?: string[] | undefined;
    workspacePlan?: string[] | undefined;
    businessName?: string[] | undefined;
    businessType?: string[] | undefined;
    countryCode?: string[] | undefined;
    fullName?: string[] | undefined;
    jobTitle?: string[] | undefined;
    referralSource?: string[] | undefined;
  };
};
