import { Button, Container, Typography } from '@mui/material'

import styles from './navbar.module.css'

export const Navbar = () => {
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
                    <Button variant="text" color="inherit" size="small">Log In</Button>
                    <Button variant="contained" size="small" className={styles.heroBtn}>Chat as guest</Button>
                </div>
                </div>
            </Container>
        </nav>
    )
}
