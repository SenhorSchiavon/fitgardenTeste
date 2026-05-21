import { Button } from "@/components/ui/button"
import { Bell, HelpCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title: string
  subtitle?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export function Header({ title, subtitle, searchValue, onSearchChange }: HeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-border/40 pb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-primary sm:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-56 h-9 bg-white pl-8 border-gray-200"
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

       
      </div>
    </div>
  )
}
