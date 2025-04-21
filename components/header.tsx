import { Button } from "@/components/ui/button"
import { Bell, HelpCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input type="search" placeholder="Buscar..." className="w-56 h-9 bg-white pl-8 border-gray-200" />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
