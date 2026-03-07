import { Alert } from "@mui/material"

export const InfoAlert = ({ topOffset, children }) => {
    return(
        <Alert
            severity="info"
            sx={{
                backgroundColor: 'background.paper',
                position: 'fixed',
                zIndex: 1000,
                margin: 'auto',
                left: 0,
                right: 0,
                justifySelf: 'center',
                top: topOffset
            }}
        >
            {children}
        </Alert>
    )
}
