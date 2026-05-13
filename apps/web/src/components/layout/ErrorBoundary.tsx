import { Component, type ReactNode } from "react";
import { IS_DEV } from "@/config";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (IS_DEV) {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-3 text-lg font-medium text-cyan-100">页面暂时无法显示</div>
          <div className="mb-6 max-w-md text-sm leading-6 text-apm-muted">
            当前模块遇到异常，请重试。若问题持续出现，请联系管理员处理。
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="border border-cyan-400/20 bg-cyan-400 px-4 py-2 text-sm font-medium text-[#020c1b] transition hover:opacity-85"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
