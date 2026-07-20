export interface IClientDetails {
  ipAddress: string;
  userAgent: string;
  browserUrl: string;
  accessedAt: Date;
}

export interface IServerDetails {
  hostname: string;
  platform: string;
  uptime: string;
}

export interface IActionLog {
  email: string;
  role: string;
  method: string;
  route: string;
  action: string;
  clientDetails: IClientDetails;
  serverDetails: IServerDetails;
  requestStatusCode: number;
  responseStatusCode: number;
  timestamp?: Date;
}
