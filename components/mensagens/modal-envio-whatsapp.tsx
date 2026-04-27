"use client"

import { useState, useEffect } from "react"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Info, AlertTriangle, Search, User, Check } from "lucide-react"
import { useMensagens } from "@/hooks/useMensagens"
import { useClientes } from "@/hooks/useClientes"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface ModalEnvioWhatsAppProps {
    clienteId: number | null
    clienteNome?: string
    onClose: () => void
}

export function ModalEnvioWhatsApp({ clienteId, clienteNome, onClose }: ModalEnvioWhatsAppProps) {
    const { modelos, prepareMessage, registerSend } = useMensagens()
    const { filteredClientes: clientes, refresh } = useClientes()
    
    const [localClienteId, setLocalClienteId] = useState<number | null>(null)
    const [localClienteNome, setLocalClienteNome] = useState("")
    const [selectedModeloId, setSelectedModeloId] = useState<number | null>(null)
    const [preview, setPreview] = useState("")
    const [extraVars, setExtraVars] = useState({ desconto: "", codigo: "" })
    const [search, setSearch] = useState("")

    // Sincroniza o estado inicial ao abrir
    useEffect(() => {
        if (clienteId !== null) {
            if (clienteId === -1) {
                setLocalClienteId(null)
                setLocalClienteNome("")
            } else {
                setLocalClienteId(clienteId)
                setLocalClienteNome(clienteNome || "")
            }
            setSelectedModeloId(null)
            setPreview("")
            setSearch("")
        }
    }, [clienteId, clienteNome])

    // Atualiza o preview dinamicamente
    useEffect(() => {
        if (localClienteId && selectedModeloId) {
            prepareMessage(localClienteId, selectedModeloId, extraVars).then(setPreview)
        } else {
            setPreview("")
        }
    }, [localClienteId, selectedModeloId, extraVars, prepareMessage])

    const handleSend = () => {
        const cliente = clientes.find(c => c.id === localClienteId)
        if (!preview || !cliente) return

        const phone = (cliente.telefone || "").replace(/\D/g, "")
        const text = encodeURIComponent(preview)
        
        if (phone) {
            window.open(`https://wa.me/55${phone}?text=${text}`, "_blank")
            registerSend(localClienteId!, selectedModeloId!, preview)
            onClose()
        } else {
            // Se não tem telefone, redireciona para a central para tratar
            window.location.href = `/mensagens?clienteId=${localClienteId}`
        }
    }

    const isNewEnvio = clienteId === -1

    return (
        <Dialog open={clienteId !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[650px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                {/* HEADER PREMIUM */}
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-4 font-serif text-2xl text-white">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <MessageCircle className="h-6 w-6 text-white" />
                            </div>
                            {localClienteId ? `Mensagem para ${localClienteNome}` : "Novo Envio Rápido"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 mt-2 text-sm">
                            Selecione o cliente e o modelo para disparar no WhatsApp.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    {/* PASSO 1: BUSCA DE CLIENTE (Só se for novo envio) */}
                    {isNewEnvio && !localClienteId && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Pesquisar Cliente</label>
                                {search && <span className="text-[10px] text-emerald-500 font-bold">{clientes.length} encontrados</span>}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Comece a digitar o nome..." 
                                    className="pl-12 h-14 border-slate-100 bg-slate-50 rounded-2xl text-base focus:bg-white transition-all shadow-inner"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value)
                                        refresh(e.target.value)
                                    }}
                                />
                            </div>
                            <ScrollArea className="h-[200px] rounded-2xl border border-slate-50 bg-slate-50/30 p-2">
                                <div className="space-y-1">
                                    {clientes.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setLocalClienteId(c.id)
                                                setLocalClienteNome(c.nome)
                                            }}
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                                    {c.nome.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{c.nome}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{c.telefone}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                    {search && clientes.length === 0 && (
                                        <div className="p-8 text-center text-slate-300 italic text-sm">Nenhum cliente encontrado</div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* CONTEÚDO PRINCIPAL (Após cliente selecionado) */}
                    {localClienteId && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
                            {/* MODELOS */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {isNewEnvio ? "2. Escolha o Modelo" : "1. Escolha o Modelo"}
                                    </label>
                                    {isNewEnvio && (
                                        <button onClick={() => setLocalClienteId(null)} className="text-[9px] font-bold text-blue-500 hover:underline">Trocar Cliente</button>
                                    )}
                                </div>
                                <ScrollArea className="h-[250px] rounded-2xl border border-slate-100 p-2">
                                    <div className="space-y-1">
                                        {modelos.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedModeloId(m.id)}
                                                className={cn(
                                                    "w-full text-left px-4 py-4 rounded-xl text-xs font-bold transition-all border-2",
                                                    selectedModeloId === m.id 
                                                        ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]" 
                                                        : "hover:bg-slate-50 text-slate-600 border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{m.titulo}</span>
                                                    {selectedModeloId === m.id && <Check className="h-3 w-3 text-emerald-400" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* PREVIEW & VARS */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview</label>
                                <div className="h-[250px] rounded-2xl border border-slate-100 p-6 bg-slate-50 text-[12px] font-medium text-slate-600 overflow-y-auto whitespace-pre-wrap relative italic leading-relaxed shadow-inner">
                                    {preview || (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center gap-2">
                                            <Info className="h-8 w-8" />
                                            <p>Selecione um modelo...</p>
                                        </div>
                                    )}
                                    {preview.includes("{") && (
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-black border border-amber-100 shadow-sm">
                                            <AlertTriangle className="h-3.5 w-3.5" /> VARIÁVEL PENDENTE
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VARIÁVEIS MANUAIS */}
                    {selectedModeloId && (localClienteId) && (selectedModeloId && modelos.find(m => m.id === selectedModeloId)?.corpo.match(/\{desconto\}|\{codigo\}/)) && (
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2">
                             {modelos.find(m => m.id === selectedModeloId)?.corpo.includes("{desconto}") && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Desconto (%)</label>
                                    <Input value={extraVars.desconto} onChange={e => setExtraVars({...extraVars, desconto: e.target.value})} className="h-11 border-slate-200 rounded-xl" placeholder="Ex: 10" />
                                </div>
                             )}
                             {modelos.find(m => m.id === selectedModeloId)?.corpo.includes("{codigo}") && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Código Cupom</label>
                                    <Input value={extraVars.codigo} onChange={e => setExtraVars({...extraVars, codigo: e.target.value})} className="h-11 border-slate-200 rounded-xl" placeholder="Ex: FIT10" />
                                </div>
                             )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</Button>
                    <Button 
                        disabled={!selectedModeloId || preview.includes("{") || !localClienteId}
                        className="bg-slate-900 hover:bg-black text-white rounded-2xl gap-3 px-10 font-black text-xs uppercase tracking-widest h-14 shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={handleSend}
                    >
                        <Send className="h-5 w-5" /> Abrir no WhatsApp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
