import { Button, Container, Typography } from '@mui/material'

import styles from './navbar.module.css'

export const Navbar = ({ handleModalOpen, user, handleGoToChat, logout }) => {
    return(
        <nav className={styles.nav}>
            <Container>
                <div className={styles.navInner}>
                    <div className={styles.logo}>
                        <Typography variant="h4" fontWeight={700} color="text.primary">
                            Fin<span style={{color: '#10B981'}}>Wise</span>
                        </Typography>
                    </div>
                    <div className={styles.navLinks}>
                        <a href="#product" className={styles.navLink}>Product</a>
                        <a href="#our-goal" className={styles.navLink}>Our Goal</a>
                        <a href="#about-us" className={styles.navLink}>About Us</a>
                    </div>
                    <div className={styles.navActions}>
                        <Button variant="text" color="inherit" size="small" onClick={() => user.userId ? logout() : handleModalOpen()}>
                            {user.userId ? 'Log out' : 'Log in'}
                        </Button>
                        <Button variant="contained" size="small" className={styles.heroBtn} onClick={handleGoToChat}>
                            {user.userId ? 'Go to chat' : 'Chat as guest'}
                        </Button>
                    </div>
                </div>
            </Container>
        </nav>
    )
}
