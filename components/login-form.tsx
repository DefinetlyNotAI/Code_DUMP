"use client"

import {type FormEvent, useState} from "react"
import {useRouter, useSearchParams} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Shield} from "lucide-react"
import {fetchWithCsrf} from "@/lib/csrf-client"

export default function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get("redirect") || "/"

    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await fetchWithCsrf("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({password}),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                // Clear password from memory
                setPassword("")

                // Redirect to intended destination
                router.push(redirect)
                router.refresh()
            } else if (response.status === 429) {
                setError(data.error || "Too many attempts. Please try again later.")
            } else {
                setError(data.error || "Authentication failed")
            }
        } catch (err) {
            console.error("[LOGIN] Request failed", err)
            setError("Unable to connect to server")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary-foreground"/>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Email Supervision Dashboard</CardTitle>
                <CardDescription>Enter the master password to access the system</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Master Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter master password"
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Authenticating..." : "Sign In"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>This is a secure internal system.</p>
                    <p>All access attempts are logged.</p>
                </div>
            </CardContent>
        </Card>
    )
}

