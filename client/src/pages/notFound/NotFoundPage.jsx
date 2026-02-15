import { Typography } from "@mui/material"

export const NotFoundPage = () => {
    return(
        <div 
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}
        >
            <Typography variant="h3">Oops! Page not found</Typography>
            <a href="/">Return to Home</a>
        </div>
    )
}
