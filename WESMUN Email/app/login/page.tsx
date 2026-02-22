/**
 * Login page component
 *
 * Security features:
 * - Client-side form with server-side validation
 * - Password never stored in state longer than necessary
 * - Error messages don't leak information
 * - Automatic redirect on success
 */

import {Suspense} from "react"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Suspense fallback={<LoginPageSkeleton/>}>
                <LoginForm/>
            </Suspense>
        </div>
    )
}

function LoginPageSkeleton() {
    return (
        <div className="w-full max-w-md h-100 bg-card rounded-lg border animate-pulse"/>
    )
}
