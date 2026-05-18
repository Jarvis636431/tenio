/**
 * 通用 API 响应包装类型。
 * 后端统一返回结构：{ data: T, message?, status?, code?, success?, timestamp? }
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
  timestamp?: string;
  code?: number | string;
  success?: boolean;
}
