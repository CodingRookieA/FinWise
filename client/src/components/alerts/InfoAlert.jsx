import { Alert } from "@mui/material"

export const InfoAlert = ({ children }) => {
    return(
        <Alert
            severity="info"
            sx={{
                backgroundColor: 'background.paper',
                position: 'fixed',
                zIndex: 1000,
                justifySelf: 'center',
                top: '5rem'
            }}
        >
            {children}
        </Alert>
    )
}
