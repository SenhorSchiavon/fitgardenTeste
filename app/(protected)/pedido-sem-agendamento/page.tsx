"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Trash, CreditCard, Send } from "lucide-react";
import { Header } from "@/components/header";
import { useClientes } from "@/hooks/useClientes";
import { useCardapios } from "@/hooks/useCardapios";
import { useOpcoesDoCardapio } from "@/hooks/useOpcoesDoCardapio";
import {  FormaPagamento, usePedidosSemAgendamento } from "@/hooks/usePedidosSemAgendamento";

type ItemPedidoUi = {
  id: string;
  opcaoId: number;
  tamanhoId: number;
  quantidade: number;
  preco: number;
};

export default function PedidoSemAgendamento() {
  const { clientes } = useClientes();
  const { cardapios } = useCardapios();
  const cardapioAtivo = cardapios.find((c) => c.ativo) ?? null;
  const { opcoes } = useOpcoesDoCardapio(cardapioAtivo?.id);

  const {
    createPedido,
    finalizarPagamento: finalizarPagamentoApi,
    loading,
  } = usePedidosSemAgendamento();

  const [pedido, setPedido] = useState({
    clienteId: "" as string, // ✅ agora é id
    observacoes: "",
    formaPagamento: "DINHEIRO" as FormaPagamento, // ✅ enum backend
    itens: [] as ItemPedidoUi[],
  });

  const [novoItem, setNovoItem] = useState({
    opcaoId: "" as string,
    tamanhoId: "" as string,
    quantidade: 1,
  });

  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [confirmacaoDialogOpen, setConfirmacaoDialogOpen] = useState(false);
  const [pedidoCriadoId, setPedidoCriadoId] = useState<number | null>(null);

  const opcoesMap = useMemo(() => {
    const m = new Map<number, any>();
    (opcoes || []).forEach((o: any) => m.set(Number(o.id), o));
    return m;
  }, [opcoes]);

  function getPreco(opcaoId: number, tamanhoId: number) {
    const opcao = opcoesMap.get(opcaoId);
    const t = opcao?.tamanhos?.find((x: any) => Number(x.tamanhoId) === tamanhoId);
    return Number(t?.preco ?? 0);
  }

  function getLabelOpcao(opcaoId: number) {
    return opcoesMap.get(opcaoId)?.nome ?? "-";
  }

  function getLabelTamanho(opcaoId: number, tamanhoId: number) {
    const opcao = opcoesMap.get(opcaoId);
    const t = opcao?.tamanhos?.find((x: any) => Number(x.tamanhoId) === tamanhoId);
    return t?.tamanhoLabel ?? "-";
  }

  const handleAddItem = () => {
    const opcaoId = Number(novoItem.opcaoId);
    const tamanhoId = Number(novoItem.tamanhoId);
    if (!opcaoId || !tamanhoId) return;

    const preco = getPreco(opcaoId, tamanhoId);
    const newItem: ItemPedidoUi = {
      id: `ITEM${pedido.itens.length + 1}`,
      opcaoId,
      tamanhoId,
      quantidade: Math.max(1, Number(novoItem.quantidade || 1)),
      preco,
    };

    setPedido((prev) => ({
      ...prev,
      itens: [...prev.itens, newItem],
    }));

    setNovoItem({ opcaoId: "", tamanhoId: "", quantidade: 1 });
  };

  const handleRemoveItem = (id: string) => {
    setPedido((prev) => ({
      ...prev,
      itens: prev.itens.filter((item) => item.id !== id),
    }));
  };

  const handleQuantityChange = (id: string, change: number) => {
    setPedido((prev) => ({
      ...prev,
      itens: prev.itens.map((item) =>
        item.id === id ? { ...item, quantidade: Math.max(1, item.quantidade + change) } : item,
      ),
    }));
  };

  const calcularTotal = () => {
    return pedido.itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
  };

  const handlePagamento = () => {
    setPagamentoDialogOpen(true);
  };

  const handleFinalizarPagamento = async () => {
    // 1) cria o pedido (sem agendamento)
    const result = await createPedido({
      clienteId: Number(pedido.clienteId),
      tipo: "RETIRADA",
      observacoes: pedido.observacoes,
      formaPagamento: pedido.formaPagamento,
      itens: pedido.itens.map((it) => ({
        opcaoId: it.opcaoId,
        tamanhoId: it.tamanhoId,
        quantidade: it.quantidade,
      })),
    });

    setPedidoCriadoId(result.pedidoId);

    // 2) se for pagamento pendente (dinheiro/credito/debito/pix/link), você pode:
    // - ou já abrir confirmação e o caixa confirma depois
    // - ou confirmar agora chamando finalizarPagamento
    // vou manter teu fluxo: "Finalizar Pagamento" = confirmar já
    await finalizarPagamentoApi(result.pedidoId, {
      formaPagamento: pedido.formaPagamento === "PLANO" ? "DINHEIRO" : pedido.formaPagamento,
    });

    setPagamentoDialogOpen(false);
    setConfirmacaoDialogOpen(true);
  };

  const handleEnviarWhatsapp = () => {
    // aqui você pode montar mensagem com cliente + itens e abrir wa.me
    alert("Resumo do pedido enviado para o WhatsApp do cliente!");
  };

  const handleFinalizarPedido = () => {
    setConfirmacaoDialogOpen(false);
    setPedidoCriadoId(null);
    setPedido({
      clienteId: "",
      observacoes: "",
      formaPagamento: "DINHEIRO",
      itens: [],
    });
  };

  const tamanhosDaOpcaoSelecionada = useMemo(() => {
    const opcaoId = Number(novoItem.opcaoId);
    const opcao = opcoesMap.get(opcaoId);
    return opcao?.tamanhos ?? [];
  }, [novoItem.opcaoId, opcoesMap]);

  const clienteSelecionado = useMemo(() => {
    const id = Number(pedido.clienteId);
    return (clientes || []).find((c: any) => Number(c.id) === id) ?? null;
  }, [pedido.clienteId, clientes]);

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Pedido sem Agendamento"
        subtitle="Crie pedidos para retirada imediata ou produtos congelados"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cliente">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cliente">Cliente</TabsTrigger>
                <TabsTrigger value="itens">Itens do Pedido</TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select
                    value={pedido.clienteId}
                    onValueChange={(value) => setPedido((p) => ({ ...p, clienteId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente: any) => (
                        <SelectItem key={cliente.id} value={String(cliente.id)}>
                          {cliente.nome} - {cliente.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={pedido.observacoes}
                    onChange={(e) =>
                      setPedido((p) => ({ ...p, observacoes: e.target.value }))
                    }
                    placeholder="Alguma observação sobre o pedido..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="itens" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Opção</Label>
                    <Select
                      value={novoItem.opcaoId}
                      onValueChange={(value) =>
                        setNovoItem((n) => ({ ...n, opcaoId: value, tamanhoId: "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcoes.map((opcao: any) => (
                          <SelectItem key={opcao.id} value={String(opcao.id)}>
                            {opcao.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho</Label>
                    <Select
                      value={novoItem.tamanhoId}
                      onValueChange={(value) =>
                        setNovoItem((n) => ({ ...n, tamanhoId: value }))
                      }
                      disabled={!novoItem.opcaoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {tamanhosDaOpcaoSelecionada.map((t: any) => (
                          <SelectItem key={t.tamanhoId} value={String(t.tamanhoId)}>
                            {t.tamanhoLabel} - R$ {Number(t.preco).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setNovoItem((n) => ({
                          ...n,
                          quantidade: Math.max(1, (n.quantidade || 1) - 1),
                        }))
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      className="w-16 text-center mx-2"
                      value={novoItem.quantidade || 1}
                      onChange={(e) =>
                        setNovoItem((n) => ({
                          ...n,
                          quantidade: Number.parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setNovoItem((n) => ({
                          ...n,
                          quantidade: (n.quantidade || 1) + 1,
                        }))
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!novoItem.opcaoId || !novoItem.tamanhoId}
                  >
                    Adicionar Item
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedido.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{getLabelOpcao(item.opcaoId)}</TableCell>
                          <TableCell>{getLabelTamanho(item.opcaoId, item.tamanhoId)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="mx-2">{item.quantidade}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>R$ {item.preco.toFixed(2)}</TableCell>
                          <TableCell>
                            R$ {(item.preco * item.quantidade).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {pedido.itens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Nenhum item adicionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {calcularTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>R$ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button
                className="w-full"
                onClick={handlePagamento}
                disabled={pedido.itens.length === 0 || !pedido.clienteId || loading}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Pagamento
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleEnviarWhatsapp}
                disabled={pedido.itens.length === 0 || !pedido.clienteId}
              >
                <Send className="mr-2 h-4 w-4" /> Enviar para WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Pagamento</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <RadioGroup
                value={pedido.formaPagamento}
                onValueChange={(value) =>
                  setPedido((p) => ({ ...p, formaPagamento: value as any }))
                }
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DINHEIRO" id="DINHEIRO" />
                  <Label htmlFor="DINHEIRO">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CREDITO" id="CREDITO" />
                  <Label htmlFor="CREDITO">Cartão de Crédito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DEBITO" id="DEBITO" />
                  <Label htmlFor="DEBITO">Cartão de Débito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PIX" id="PIX" />
                  <Label htmlFor="PIX">PIX</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Valor Total</Label>
              <div className="text-2xl font-bold">
                R$ {calcularTotal().toFixed(2)}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPagamentoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleFinalizarPagamento}
                disabled={!pedido.clienteId || pedido.itens.length === 0 || loading}
              >
                Finalizar Pagamento
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmacaoDialogOpen} onOpenChange={setConfirmacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido Finalizado</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>Pedido finalizado com sucesso!</p>
            <p className="mt-2">Cliente: {clienteSelecionado?.nome ?? "-"}</p>
            <p>Total: R$ {calcularTotal().toFixed(2)}</p>
            <p>Forma de Pagamento: {pedido.formaPagamento}</p>
            {pedidoCriadoId != null && <p className="mt-2">Pedido: #{pedidoCriadoId}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleFinalizarPedido}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
