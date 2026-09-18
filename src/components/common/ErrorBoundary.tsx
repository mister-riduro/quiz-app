import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/90 border-2 border-red-200 rounded-3xl shadow-md text-center max-w-lg mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 border-2 border-red-300 text-duo-red flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-black text-duo-dark mb-1">
            {this.props.fallbackTitle || "Komponen Soal Mengalami Kendala"}
          </h3>

          <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-5 leading-relaxed">
            {this.props.fallbackMessage ||
              "Terjadi kesalahan saat merender data soal. Silakan muat ulang komponen ini."}
          </p>

          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2.5 rounded-2xl bg-duo-green hover:bg-duo-green-border text-white font-black text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Muat Ulang Soal</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
