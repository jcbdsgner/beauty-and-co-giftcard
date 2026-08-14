export type AccountInfo = {
  firstName: string;
  lastName: string;
  email: string;
};

export type Account = AccountInfo & { connected: boolean };

export const defaultAccountInfo: AccountInfo = {
  firstName: "",
  lastName: "",
  email: "",
};
