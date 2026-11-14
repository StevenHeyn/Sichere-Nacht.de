import 'server-only';
/** Operator-supplied ordering channel. A public login URL is not proof of account access. */
export const secplanPortal = {
  loginUrl: 'https://www.secplan.de/account/login',
  channel: 'manual_portal',
  selectedByOperator: true,
  accountAccessVerified: false,
  supplierCheckoutVerified: false,
  automaticTransmission: false
} as const;
