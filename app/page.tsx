/**
 * Main dashboard page
 * Server component that checks authentication
 */

import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const isAuthenticated = await requireAuth()

  if (!isAuthenticated) {
    redirect("/login")
  }

  return <DashboardClient />
}
