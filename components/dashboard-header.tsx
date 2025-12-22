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
import {DashboardHeaderProps} from "@/types";
import {Cache} from "@/lib/cache"

export function DashboardHeader({accounts, selectedAccount, onAccountChange, disabled = false}: DashboardHeaderProps) {
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

            // Clear all cached data on logout
            Cache.clear()

            router.push("/login")
            router.refresh()
        } catch (err) {
            console.error("Logout failed", err)
        }
    }

    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <Shield className="h-5 w-5 text-primary shrink-0"/>
                    <h1 className="text-sm md:text-lg font-semibold truncate">
                        <span className="hidden sm:inline">Email Supervision Dashboard</span>
                        <span className="sm:hidden">Email Dashboard</span>
                    </h1>
                </div>

                {accounts.length > 0 && (
                    <Popover open={open} onOpenChange={(newOpen) => {
                        if (!disabled) {
                            setOpen(newOpen)
                        }
                    }}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-auto md:w-70 justify-start bg-transparent min-w-0 hidden sm:flex"
                                disabled={disabled}
                            >
                                <Search className="h-4 w-4 mr-2 text-muted-foreground shrink-0"/>
                                <span className="truncate">
                                    {disabled ? 'Loading...' : selectedLabel}
                                </span>
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

            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
                <LogOut className="h-4 w-4 md:mr-2"/>
                <span className="hidden md:inline">Logout</span>
            </Button>
        </header>
    )
}
