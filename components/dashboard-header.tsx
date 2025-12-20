"use client"

/**
 * Dashboard header with account search and logout
 */

import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {LogOut, Search, Shield} from "lucide-react"
import {useMemo, useState} from "react"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {fetchWithCsrf} from "@/lib/csrf-client"

interface Account {
    id: string
    label: string
}

interface DashboardHeaderProps {
    accounts: Account[]
    selectedAccount: string | null
    onAccountChange: (accountId: string) => void
}

export function DashboardHeader({accounts, selectedAccount, onAccountChange}: DashboardHeaderProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const selectedLabel = useMemo(() => {
        return accounts.find((acc) => acc.id === selectedAccount)?.label || "Select account"
    }, [accounts, selectedAccount])

    async function handleLogout() {
        try {
            await fetchWithCsrf("/api/auth/logout", {
                method: "POST",
            })

            router.push("/login")
            router.refresh()
        } catch (err) {
            console.error("Logout failed", err)
        }
    }

    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary"/>
                    <h1 className="text-lg font-semibold">Email Supervision Dashboard</h1>
                </div>

                {accounts.length > 0 && (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-70 justify-start bg-transparent">
                                <Search className="h-4 w-4 mr-2 text-muted-foreground"/>
                                <span className="truncate">{selectedLabel}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-70 p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search email accounts..."/>
                                <CommandList>
                                    <CommandEmpty>No accounts found.</CommandEmpty>
                                    <CommandGroup>
                                        {accounts.map((account) => (
                                            <CommandItem
                                                key={account.id}
                                                value={account.label}
                                                onSelect={() => {
                                                    onAccountChange(account.id)
                                                    setOpen(false)
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{account.label}</span>
                                                    <span className="text-xs text-muted-foreground">{account.id}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2"/>
                Logout
            </Button>
        </header>
    )
}
