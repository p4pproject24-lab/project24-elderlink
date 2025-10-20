export interface ApiResponse<T = any> {
  status: number;
  message: string | Record<string, string>;
  data?: T;
  timestamp: string;
} 