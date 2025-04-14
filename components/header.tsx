import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Home } from "lucide-react"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6 pt-2">
      <div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Voltar para o início</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      <Button variant="outline" size="icon" asChild>
        <Link href="/">
          <Home className="h-5 w-5" />
          <span className="sr-only">Página Inicial</span>
        </Link>
      </Button>
    </div>
  )
}
