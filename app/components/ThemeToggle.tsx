"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

export default function ThemeToggle() {
    const { setTheme } = useTheme()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Choose color theme" className="rounded-xl">
                    <Sun className="size-4 dark:hidden" aria-hidden="true" />
                    <Moon className="hidden size-4 dark:block" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setTheme("light")}><Sun className="mr-2 size-4" />Light</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("dark")}><Moon className="mr-2 size-4" />Dark</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("system")}><Monitor className="mr-2 size-4" />System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
