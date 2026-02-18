import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastProps {
    toast: Toast
    onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastProps) {
    useEffect(() => {
        const duration = toast.duration || 5000
        const timer = setTimeout(() => {
            onClose(toast.id)
        }, duration)

        return () => clearTimeout(timer)
    }, [toast, onClose])

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle
    }

    const Icon = icons[toast.type]

    return (
        <div className={`toast toast-${toast.type}`}>
            <Icon size={18} className="toast-icon" />
            <span className="toast-message">{toast.message}</span>
            <button
                className="toast-close"
                onClick={() => onClose(toast.id)}
            >
                <X size={16} />
            </button>
        </div>
    )
}

interface ToastContainerProps {
    toasts: Toast[]
    onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    )
}
