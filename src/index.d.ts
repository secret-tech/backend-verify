declare interface VerificationData {
  id: string;
  consumer: string;
  attempts: number;
  expiredOn: number;
  code?: string;
}

declare interface ValidationResult {
  isValid: boolean;
  verification?: VerificationData;
}

/**
 * Storage Options
 */
declare interface ValueOptions {
  ttlInSeconds: number;
}

/**
 * StorageService interface.
 */
declare interface StorageService {

  /**
   * Set value with expiration options
   *
   * @param name
   * @param value
   * @param options
   */
  set<T>(name: string, value: T, options?: ValueOptions): Promise<T>;

  /**
   * Remove value
   *
   * @param name
   */
  remove<T>(name: string): Promise<T>;

  /**
   * Get value
   *
   * @param name
   * @param defaultValue
   */
  get<T>(name: string, defaultValue: T): Promise<T>;

}

/**
 * VerificationService interface.
 */
declare interface VerificationService {
  initiate(params: any, tenantData: TenantVerificationResult): Promise<any>;
  validate(verificationId: string, params: any, tenantData: TenantVerificationResult): Promise<ValidationResult>;
  remove(verificationId: string): Promise<boolean>;
  getVerification(verificationId: string): Promise<VerificationData>;
}

declare interface ParamsType {
  consumer: string;
  template?: any;
  generateCode?: GenerateCodeType;
  payload?: any;
  policy: PolicyParamsType;
}

declare interface PolicyParamsType {
  forcedVerificationId?: string;
  forcedCode?: string;
  expiredOn: string;
}

declare interface GenerateCodeType {
  symbolSet: Array<string>;
  length: number;
}

declare interface EmailTemplateType {
  fromEmail: string;
  fromName?: string;
  subject: string;
  body: string;
}

declare interface TenantVerificationResult {
  id: string;
  login: string;
  jti: string;
  iat: number;
  aud: string;
  isTenant: boolean;
}

declare interface AuthenticatorSecret {
  secret: string;
  verified: boolean;
}
