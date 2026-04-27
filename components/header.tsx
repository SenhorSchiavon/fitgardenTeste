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
    <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
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
