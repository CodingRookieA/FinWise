import toast from "react-hot-toast"

const theme = {
  bg: '#1a1f2e',
  bgSecondary: '#141820',
  border: 'rgba(255,255,255,0.07)',
  teal: '#2dd4bf',
  tealDim: 'rgba(45,212,191,0.15)',
  red: '#f87171',
  redDim: 'rgba(248,113,113,0.12)',
  textPrimary: '#e2e8f0',
  textMuted: '#64748b',
};

const baseStyle = {
  background: theme.bg,
  color: theme.textPrimary,
  border: `1px solid ${theme.border}`,
  borderRadius: '10px',
  padding: '12px 16px',
  fontSize: '13.5px',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  maxWidth: '360px',
  backdropFilter: 'blur(12px)',
};

const toastHelper = (type, message) => {
    toast.dismiss();
    switch (type){
        case 'success':
            toast.success(message, {
                style: {
                    ...baseStyle,
                    borderColor: 'rgba(45,212,191,0.3)',
                    background: `linear-gradient(135deg, ${theme.bg} 0%, #1a2a2a 100%)`,
                },
                iconTheme: {
                    primary: theme.teal,
                    secondary: theme.tealDim,
                },
                duration: 3500,
            })
            break
        case 'error':
            toast.error(message, {
                style: {
                    ...baseStyle,
                    borderColor: 'rgba(248,113,113,0.25)',
                    background: `linear-gradient(135deg, ${theme.bg} 0%, #1f1a1a 100%)`,
                },
                iconTheme: {
                    primary: theme.red,
                    secondary: theme.redDim,
                },
                duration: 4500,
            })
            break
        case 'loading':
            toast.loading(message, {
                style: {
                    ...baseStyle,
                    borderColor: 'rgba(45,212,191,0.2)',
                    color: theme.textMuted,
                },
                iconTheme: {
                    primary: theme.teal,
                    secondary: 'transparent',
                },
            })
            break
        default:
            toast(message, {
                style: {
                    ...baseStyle
                },
                iconTheme: {
                    primary: theme.teal,
                    secondary: theme.tealDim,
                },
                duration: 3500,
            })
    }
}

export default toastHelper
