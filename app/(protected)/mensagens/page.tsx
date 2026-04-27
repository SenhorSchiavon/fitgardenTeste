"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Search, Plus, Trash2, Edit3, Save, Send, History, Info, Smartphone, AlertTriangle, ChevronRight, User, Check } from "lucide-react"
import { useMensagens, MensagemModelo } from "@/hooks/useMensagens"
import { useClientes } from "@/hooks/useClientes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function MensagensPage() {
  const { modelos, historico, loading, saveModelo, deleteModelo, prepareMessage, registerSend } = useMensagens()
  const { filteredClientes: allClientes, loading: loadingClientes, refresh } = useClientes()

  // Filtros de CRM
  const [activeFilter, setActiveFilter] = useState<'all' | 'sem_saldo' | 'sumidos'>('all')
  const [search, setSearch] = useState("")

  const clientes = allClientes.filter(c => {
    const matchesSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search)
    if (!matchesSearch) return false

    if (activeFilter === 'sem_saldo') {
      return (c.planos && c.planos.length > 0) && c.planos.every(p => p.saldoUnidades <= 0)
    }
    if (activeFilter === 'sumidos') {
      if (!c.pedidos || c.pedidos.length === 0) return true
      const vinteDiasAtras = new Date()
      vinteDiasAtras.setDate(vinteDiasAtras.getDate() - 20)
      const dataUltimoPedido = new Date(c.pedidos[0].createdAt)
      return dataUltimoPedido < vinteDiasAtras
    }
    return true
  })

  // Estados para Envio
  const [selectedClienteIds, setSelectedClienteIds] = useState<number[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [selectedModeloId, setSelectedModeloId] = useState<number | null>(null)
  const [extraVars, setExtraVars] = useState<Record<string, string>>({
      desconto: "",
      codigo: "",
      descricao_promo: ""
  })
  const [preview, setPreview] = useState("")

  // Estados para Edição de Modelos
  const [isEditing, setIsEditing] = useState(false)
  const [currentModelo, setCurrentModelo] = useState<Partial<MensagemModelo>>({ titulo: "", corpo: "" })

  const selectedClienteId = selectedClienteIds[queueIndex] || null
  const selectedCliente = clientes.find(c => c.id === selectedClienteId)
  const selectedModelo = modelos.find(m => m.id === selectedModeloId)

  useEffect(() => {
    if (selectedClienteId && selectedModeloId) {
        prepareMessage(selectedClienteId, selectedModeloId, extraVars).then(setPreview)
    } else {
        setPreview("")
    }
  }, [selectedClienteId, selectedModeloId, extraVars, prepareMessage])

  const handleOpenWhatsApp = () => {
    if (!selectedCliente || !preview) return
    const phone = selectedCliente.telefone.replace(/\D/g, "")
    const text = encodeURIComponent(preview)
    const url = `https://wa.me/55${phone}?text=${text}`
    window.open(url, "_blank")
    registerSend(selectedCliente.id, selectedModeloId!, preview)
  }

  const toggleClienteSelection = (id: number) => {
    setSelectedClienteIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
    setQueueIndex(0)
  }

  const handleSaveModelo = async () => {
    if (!currentModelo.titulo || !currentModelo.corpo) return
    await saveModelo({ id: currentModelo.id, titulo: currentModelo.titulo, corpo: currentModelo.corpo })
    setIsEditing(false)
    setCurrentModelo({ titulo: "", corpo: "" })
  }

  const hasMissingVars = preview.includes("{")

  return (
    <div className="space-y-6 pb-20">
      <Header 
        title="Mensagens" 
        subtitle="Gerencie sua comunicação via WhatsApp"
      />

      <Tabs defaultValue="envio" className="w-full">
        <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 mb-6 gap-8">
          <TabsTrigger value="envio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-0 text-sm font-bold shadow-none">
            Envio Rápido
          </TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-0 text-sm font-bold shadow-none">
            Modelos
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-0 text-sm font-bold shadow-none">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="envio" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUNA 1: CLIENTES (3/12) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clientes</h3>
              </div>
              
              <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex gap-1 overflow-x-auto no-scrollbar">
                    {[{ id: 'all', label: 'Tudo' }, { id: 'sem_saldo', label: 'Saldo 0' }, { id: 'sumidos', label: 'Sumidos' }].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id as any)}
                        className={cn(
                          "text-[9px] font-bold px-2 py-1 rounded-lg transition-all",
                          activeFilter === f.id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      <Input 
                        placeholder="Buscar..." 
                        className="pl-8 h-8 text-[11px] border-slate-100 rounded-lg bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[450px]">
                    <div className="divide-y divide-slate-50">
                      {clientes.map(cliente => {
                        const isSelected = selectedClienteIds.includes(cliente.id)
                        const isCurrent = selectedClienteId === cliente.id
                        return (
                          <div key={cliente.id} className={cn("flex items-center group px-3 py-3 transition-colors", isCurrent ? "bg-slate-50" : "hover:bg-slate-50/50")}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleClienteSelection(cliente.id)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                            <button
                              onClick={() => {
                                if (selectedClienteIds.length <= 1) setSelectedClienteIds([cliente.id]);
                                else { const idx = selectedClienteIds.indexOf(cliente.id); if (idx !== -1) setQueueIndex(idx); }
                              }}
                              className="flex-1 text-left ml-2 min-w-0"
                            >
                              <p className="text-[11px] font-bold text-slate-900 truncate">{cliente.nome}</p>
                              <p className="text-[9px] text-slate-400 font-medium">{cliente.telefone}</p>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* COLUNA 2: MODELOS (3/12) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modelo</h3>
              </div>
              <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                <ScrollArea className="h-[522px]">
                  <div className="divide-y divide-slate-50">
                    {modelos.map(modelo => (
                      <button
                        key={modelo.id}
                        onClick={() => setSelectedModeloId(modelo.id)}
                        className={cn(
                          "w-full text-left px-4 py-4 transition-all relative group",
                          selectedModeloId === modelo.id ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <p className="text-[11px] font-bold leading-tight mb-1">{modelo.titulo}</p>
                        <p className={cn("text-[8px] uppercase font-black tracking-widest opacity-40", selectedModeloId === modelo.id ? "text-white" : "text-slate-400")}>
                          {modelo.tipo}
                        </p>
                        {selectedModeloId === modelo.id && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check className="h-3 w-3 text-emerald-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* COLUNA 3: PREVIEW (6/12) */}
            <div className="lg:col-span-6 space-y-4">
              {selectedClienteIds.length > 1 && (
                <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Fila Ativa</span>
                    <span className="text-[9px] text-white/50">{queueIndex + 1} de {selectedClienteIds.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setQueueIndex(p => Math.max(0, p - 1))} disabled={queueIndex === 0} className="h-6 text-[9px] font-bold text-white/70 hover:text-white hover:bg-white/10 px-2">ANTERIOR</Button>
                    <Button variant="ghost" size="sm" onClick={() => setQueueIndex(p => Math.min(selectedClienteIds.length - 1, p + 1))} disabled={queueIndex === selectedClienteIds.length - 1} className="h-6 text-[9px] font-bold text-white/70 hover:text-white hover:bg-white/10 px-2">PRÓXIMO</Button>
                  </div>
                </div>
              )}

              <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden flex flex-col min-h-[522px] bg-white">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-serif text-slate-900">Pré-visualização</CardTitle>
                    {selectedCliente && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <User className="h-3 w-3" />
                        <span className="text-[10px] font-medium">Destinatário: <strong className="text-slate-900">{selectedCliente.nome}</strong></span>
                      </div>
                    )}
                  </div>
                  {hasMissingVars && (
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-[9px] font-black border border-amber-100">
                      <AlertTriangle className="h-3 w-3" /> CAMPOS PENDENTES
                    </div>
                  )}
                </div>

                <div className="p-8 flex-1">
                    <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap max-w-[500px] mx-auto">
                      {preview || (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 text-center">
                          <MessageCircle className="h-12 w-12 mb-3 opacity-10" />
                          <p className="text-xs italic">Selecione o cliente e o modelo para gerar a mensagem</p>
                        </div>
                      )}
                    </div>
                </div>

                {/* PAINEL DE AÇÃO INFERIOR */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                  <div className="flex flex-col gap-6">
                    {(selectedModelo?.corpo.includes("{desconto}") || selectedModelo?.corpo.includes("{codigo}") || selectedModelo?.corpo.includes("{descricao_promo}")) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedModelo?.corpo.includes("{desconto}") && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Desconto (%)</label>
                            <Input value={extraVars.desconto} onChange={e => setExtraVars({...extraVars, desconto: e.target.value})} className="h-9 bg-white border-slate-200 text-xs rounded-lg" placeholder="Ex: 15" />
                          </div>
                        )}
                        {selectedModelo?.corpo.includes("{codigo}") && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Cupom</label>
                            <Input value={extraVars.codigo} onChange={e => setExtraVars({...extraVars, codigo: e.target.value})} className="h-9 bg-white border-slate-200 text-xs rounded-lg" placeholder="Ex: NIVER15" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      disabled={!selectedCliente || !preview || hasMissingVars}
                      onClick={handleOpenWhatsApp}
                      className="h-14 w-full rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] gap-3 shadow-xl transition-all hover:scale-[1.01]"
                    >
                      <Send className="h-4 w-4" /> Enviar Mensagem
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modelos" className="mt-0">
           {/* ... Mantido igual para brevidade ou atualizado se necessário ... */}
           <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-4 space-y-4">
                  <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold gap-2" onClick={() => { setIsEditing(true); setCurrentModelo({ titulo: "", corpo: "" }); }}>
                    <Plus className="h-4 w-4" /> Novo Modelo
                  </Button>
                  <div className="space-y-2">
                    {modelos.map(modelo => (
                      <Card key={modelo.id} className="border-slate-100 shadow-none hover:border-slate-300 transition-all rounded-xl overflow-hidden group">
                        <div className="p-4 flex items-center justify-between bg-white">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{modelo.titulo}</p>
                            <p className="text-[9px] uppercase font-black text-slate-400">{modelo.tipo}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => { setIsEditing(true); setCurrentModelo(modelo); }}><Edit3 className="h-4 w-4" /></Button>
                            {modelo.tipo === 'PERSONALIZADO' && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => deleteModelo(modelo.id)}><Trash2 className="h-4 w-4" /></Button>}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
              </div>
              <div className="col-span-12 lg:col-span-8">
                 {isEditing ? (
                    <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                           <CardTitle className="font-serif text-lg">Editor de Modelo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
                                <Input placeholder="Título do modelo..." value={currentModelo.titulo} onChange={e => setCurrentModelo({...currentModelo, titulo: e.target.value})} className="h-11 border-slate-200 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensagem</label><span className="text-[10px] text-slate-400 font-bold">Variáveis: &#123;nome&#125;, &#123;saldo&#125;, &#123;vencimento&#125;, &#123;pedido&#125;</span></div>
                                <Textarea placeholder="Escreva aqui..." className="min-h-[300px] border-slate-200 rounded-xl p-6 leading-relaxed" value={currentModelo.corpo} onChange={e => setCurrentModelo({...currentModelo, corpo: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                <Button className="rounded-xl bg-slate-900 hover:bg-black px-10 gap-2 font-bold" onClick={handleSaveModelo}><Save className="h-4 w-4" /> Salvar</Button>
                            </div>
                        </CardContent>
                    </Card>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <Edit3 className="h-10 w-10 text-slate-200 mb-4" />
                        <h3 className="text-sm font-serif text-slate-400">Selecione um modelo para editar</h3>
                    </div>
                 )}
              </div>
           </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
           <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Data/Hora</th>
                                <th className="px-8 py-5">Cliente</th>
                                <th className="px-8 py-5">Modelo</th>
                                <th className="px-8 py-5">Mensagem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {historico.map(h => (
                                <tr key={h.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-6 text-xs text-slate-400 whitespace-nowrap">{format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-900">{h.cliente.nome}</td>
                                    <td className="px-8 py-6 text-[10px]"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-bold uppercase">{h.modelo?.titulo || "Texto Avulso"}</span></td>
                                    <td className="px-8 py-6 text-[11px] text-slate-500 italic max-w-[400px] truncate">"{h.textoEnviado}"</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
