"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Search, Plus, Trash2, Edit3, Save, Send, History, Info, Smartphone } from "lucide-react"
import { useMensagens, MensagemModelo } from "@/hooks/useMensagens"
import { useClientes } from "@/hooks/useClientes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function MensagensPage() {
  const { modelos, historico, loading, saveModelo, deleteModelo, prepareMessage, registerSend } = useMensagens()
  const { clientes, loading: loadingClientes, fetchClientes } = useClientes()

  // Estados para Envio
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [selectedModeloId, setSelectedModeloId] = useState<number | null>(null)
  const [extraVars, setExtraVars] = useState<Record<string, string>>({
      desconto: "10",
      codigo: "NIVER10",
      descricao_promo: "Combo Verão com 15% OFF"
  })
  const [preview, setPreview] = useState("")

  // Estados para Edição de Modelos
  const [isEditing, setIsEditing] = useState(false)
  const [currentModelo, setCurrentModelo] = useState<Partial<MensagemModelo>>({ titulo: "", corpo: "" })

  const selectedCliente = clientes.find(c => c.id === selectedClienteId)
  const selectedModelo = modelos.find(m => m.id === selectedModeloId)

  // Efeito para atualizar preview
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

  const handleSaveModelo = async () => {
    if (!currentModelo.titulo || !currentModelo.corpo) return
    await saveModelo({
        id: currentModelo.id,
        titulo: currentModelo.titulo,
        corpo: currentModelo.corpo
    })
    setIsEditing(false)
    setCurrentModelo({ titulo: "", corpo: "" })
  }

  return (
    <div className="space-y-6">
      <Header 
        title="Gerenciador de Mensagens" 
        subtitle="Padronize sua comunicação e fidelize clientes via WhatsApp"
      />

      <Tabs defaultValue="envio" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px] bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="envio" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Send className="h-4 w-4 mr-2" /> Envio Rápido
          </TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Edit3 className="h-4 w-4 mr-2" /> Modelos
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="h-4 w-4 mr-2" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* --- ABA DE ENVIO --- */}
        <TabsContent value="envio" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Coluna de Seleção */}
            <div className="md:col-span-4 space-y-6">
              <Card className="border-none shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Search className="h-4 w-4 text-emerald-500" /> 1. Escolha o Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <Input 
                    placeholder="Nome ou telefone..." 
                    className="mb-4 bg-slate-50 border-none h-10 rounded-xl"
                    onChange={(e) => fetchClientes({ search: e.target.value })}
                   />
                   <ScrollArea className="h-[250px] pr-4">
                      <div className="space-y-1">
                        {clientes.map(cliente => (
                          <button
                            key={cliente.id}
                            onClick={() => setSelectedClienteId(cliente.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl transition-all",
                                selectedClienteId === cliente.id 
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                                    : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <p className="text-sm font-bold truncate">{cliente.nome}</p>
                            <p className={cn("text-[10px] uppercase font-bold tracking-wider", selectedClienteId === cliente.id ? "text-white/70" : "text-slate-400")}>
                                {cliente.telefone}
                            </p>
                          </button>
                        ))}
                      </div>
                   </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-500" /> 2. Selecione o Modelo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <ScrollArea className="h-[250px] pr-4">
                      <div className="space-y-1">
                        {modelos.map(modelo => (
                          <button
                            key={modelo.id}
                            onClick={() => setSelectedModeloId(modelo.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl transition-all border-l-4",
                                selectedModeloId === modelo.id 
                                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 border-blue-600" 
                                    : "hover:bg-slate-50 text-slate-600 border-transparent"
                            )}
                          >
                            <p className="text-sm font-bold truncate">{modelo.titulo}</p>
                            <span className={cn("text-[9px] uppercase font-black px-1.5 py-0.5 rounded", selectedModeloId === modelo.id ? "bg-white/20" : "bg-slate-100 text-slate-400")}>
                                {modelo.tipo}
                            </span>
                          </button>
                        ))}
                      </div>
                   </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Coluna de Preview */}
            <div className="md:col-span-8">
               <Card className="border-none shadow-sm rounded-3xl h-full flex flex-col overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white py-4 px-8">
                     <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-serif">Pré-visualização</CardTitle>
                            <CardDescription className="text-slate-400 text-xs">Confira a mensagem antes de abrir o WhatsApp</CardDescription>
                        </div>
                        <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                            <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-8 bg-slate-50 flex flex-col">
                    <div className="flex-1 bg-white rounded-2xl shadow-inner border border-slate-100 p-6 font-medium text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[300px]">
                        {preview || (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center">
                                <Info className="h-12 w-12 mb-2 opacity-20" />
                                <p>Selecione um cliente e um modelo para ver o preview</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variáveis Adicionais</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Desconto (%)</label>
                                    <Input 
                                        value={extraVars.desconto} 
                                        onChange={e => setExtraVars({...extraVars, desconto: e.target.value})}
                                        className="h-9 bg-white text-xs rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Código</label>
                                    <Input 
                                        value={extraVars.codigo} 
                                        onChange={e => setExtraVars({...extraVars, codigo: e.target.value})}
                                        className="h-9 bg-white text-xs rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end justify-end">
                            <Button 
                                size="lg"
                                disabled={!selectedCliente || !preview}
                                onClick={handleOpenWhatsApp}
                                className="w-full md:w-auto h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-3 shadow-lg shadow-emerald-600/20 transition-all"
                            >
                                <Send className="h-5 w-5" /> Abrir no WhatsApp Web
                            </Button>
                        </div>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- ABA DE MODELOS --- */}
        <TabsContent value="modelos" className="mt-6">
           <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-4 space-y-4">
                  <Button 
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white gap-2"
                    onClick={() => {
                        setIsEditing(true)
                        setCurrentModelo({ titulo: "", corpo: "" })
                    }}
                  >
                    <Plus className="h-4 w-4" /> Novo Modelo Customizado
                  </Button>
                  
                  <div className="space-y-3">
                    {modelos.map(modelo => (
                        <Card key={modelo.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
                           <div className="p-4 flex items-center justify-between bg-white">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{modelo.titulo}</p>
                                    <p className="text-[9px] uppercase font-black text-slate-400 mt-0.5">{modelo.tipo}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                        onClick={() => {
                                            setIsEditing(true)
                                            setCurrentModelo(modelo)
                                        }}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    {modelo.tipo === 'PERSONALIZADO' && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                                            onClick={() => deleteModelo(modelo.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                           </div>
                        </Card>
                    ))}
                  </div>
              </div>

              <div className="col-span-12 lg:col-span-8">
                 {isEditing ? (
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                           <CardTitle className="font-serif">Editor de Modelo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título do Modelo</label>
                                <Input 
                                    placeholder="Ex: Lembrete de Renovação"
                                    value={currentModelo.titulo}
                                    onChange={e => setCurrentModelo({...currentModelo, titulo: e.target.value})}
                                    className="h-12 bg-slate-50 border-none rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corpo da Mensagem</label>
                                    <span className="text-[10px] text-emerald-600 font-bold">Variáveis: &#123;nome&#125;, &#123;saldo&#125;, &#123;vencimento&#125;, &#123;pedido&#125;</span>
                                </div>
                                <Textarea 
                                    placeholder="Escreva sua mensagem aqui..."
                                    className="min-h-[250px] bg-slate-50 border-none rounded-2xl p-6 leading-relaxed"
                                    value={currentModelo.corpo}
                                    onChange={e => setCurrentModelo({...currentModelo, corpo: e.target.value})}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" className="rounded-xl" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-8 gap-2" onClick={handleSaveModelo}>
                                    <Save className="h-4 w-4" /> Salvar Modelo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                            <Edit3 className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-serif text-slate-500">Selecione um modelo à esquerda ou crie um novo para editar</h3>
                    </div>
                 )}
              </div>
           </div>
        </TabsContent>

        {/* --- ABA DE HISTÓRICO --- */}
        <TabsContent value="historico" className="mt-6">
           <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Data/Hora</th>
                                <th className="px-8 py-5">Cliente</th>
                                <th className="px-8 py-5">Modelo</th>
                                <th className="px-8 py-5">Mensagem Enviada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {historico.map(h => (
                                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6 text-xs text-slate-500 font-medium whitespace-nowrap">
                                        {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-700">{h.cliente.nome}</td>
                                    <td className="px-8 py-6 text-xs">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold">
                                            {h.modelo?.titulo || "Texto Avulso"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-xs text-slate-400 italic max-w-[400px] truncate">
                                        "{h.textoEnviado}"
                                    </td>
                                </tr>
                            ))}
                            {historico.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center text-slate-300 font-serif italic">Nenhuma mensagem registrada no histórico.</td>
                                </tr>
                            )}
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
