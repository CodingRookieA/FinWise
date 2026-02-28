import { useState } from "react"
import { useEffect } from "react"
import { serverURL } from "../../utils/constants"

export const VerifyingEmailPage = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    const [verifyingTitle, setVerifyingTitle] = useState("Verifying...")

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const res = await fetch(
                    `${serverURL}/api/email/verifyEmail/${token}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include'
                    }
                )

                const result = await res.json()
                if(result.error) {
                    console.log(result.error)
                    setVerifyingTitle(result.error)
                } else {
                    window.location.href = '/questionnaire'
                }
            } catch (error) {
                console.log(error)
            }
        }

        verifyEmail()
    }, [token])

    return(
        <div>
            <h1>{verifyingTitle}</h1>
        </div>
    )
}
