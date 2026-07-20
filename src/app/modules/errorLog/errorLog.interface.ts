export interface IErrorLog {
  message: string;
  statusCode: number;
  method: string;
  route: string;
  userId?: string;
  email?: string;
  role?: string;
  stack?: string;
  errorName?: string;
  errorSources?: { path: string | number; message: string }[];
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  clientDetails?: {
    ipAddress?: string;
    userAgent?: string;
    browserUrl?: string;
  };
  timestamp?: Date;
}
