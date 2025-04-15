export interface AddressConfig {
  token: string;
  ulnManager: string;
  controller: string;
  oftProxy: string;
}

export interface LoadedUlnConfig {
  confirmations: string;
  confirmationsNull: boolean;
  executor: string;
  executorNull: boolean;
  maxMessageBytes: string;
  optionalDVNs: string[];
  optionalDVNsNull: boolean;
  requiredDVNs: string[];
  requiredDVNsNull: boolean;
  workerQuoteGasLimit: string;
}
