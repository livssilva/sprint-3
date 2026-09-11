import { type Request, type Response } from "express";
import Movimentacao from "../model/Movimentacao.js";

class MovimentacaoController {

    // 1. LISTAR TODAS AS MOVIMENTAÇÕES
    static async listar(req: Request, res: Response): Promise<void> {
        try {
            const movimentacoes = await Movimentacao.listarMovimentacoes();
            if (movimentacoes.length === 0) {
                res.status(200).json([]);
                return;
            }
            res.status(200).json(movimentacoes);
        } catch (error: any) {
            console.error("[MovimentacaoController] Erro ao listar:", error);
            res.status(500).json({ mensagem: "Erro interno ao listar movimentações." });
        }
    }

    // 2. BUSCAR MOVIMENTAÇÃO POR ID
    static async buscarPorId(req: Request, res: Response): Promise<void> {
        try {
            const idMovimentacao = Number(req.params.id);
            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({ mensagem: "ID de movimentação inválido. Informe um número inteiro positivo." });
                return;
            }

            const movimentacao = await Movimentacao.buscarPorId(idMovimentacao);
            if (!movimentacao) {
                res.status(404).json({ mensagem: "Movimentação não encontrada." });
                return;
            }

            res.status(200).json(movimentacao);
        } catch (error: any) {
            console.error("[MovimentacaoController] Erro ao buscar por ID:", error);
            res.status(500).json({ mensagem: "Erro interno ao buscar movimentação." });
        }
    }

    // 3. CADASTRAR NOVA MOVIMENTAÇÃO
    static async cadastrar(req: Request, res: Response): Promise<void> {
        try {
            const { id_produto, tipo, quantidade, observacao, motivo, preco_unitario_praticado } = req.body;

            const idProduto = Number(id_produto);
            const qtd = Number(quantidade);

            if (!idProduto || isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "Informe um ID de produto válido e maior que zero." });
                return;
            }

            const tipoFormatado = String(tipo || "").trim().toUpperCase();
            if (tipoFormatado !== 'ENTRADA' && tipoFormatado !== 'SAIDA') {
                res.status(400).json({ mensagem: "O tipo de movimentação deve ser obrigatoriamente 'ENTRADA' ou 'SAIDA'." });
                return;
            }

            if (isNaN(qtd) || qtd <= 0) {
                res.status(400).json({ mensagem: "A quantidade movimentada deve ser um número maior que zero." });
                return;
            }

            const novaMovimentacao = new Movimentacao(
                idProduto,
                tipoFormatado as 'ENTRADA' | 'SAIDA',
                qtd,
                observacao ? String(observacao).trim() : null,
                motivo ?? null,
                null,
                preco_unitario_praticado ? Number(preco_unitario_praticado) : null
            );

            await Movimentacao.cadastrarMovimentacao(novaMovimentacao);
            res.status(201).json({ mensagem: "Movimentação cadastrada com sucesso!" });

        } catch (error: any) {
            const msg = error.message || "";
            if (
                msg.includes("Estoque insuficiente") ||
                msg.includes("não existe") ||
                msg.includes("desativado") ||
                msg.includes("não encontrado")
            ) {
                res.status(422).json({ mensagem: msg });
                return;
            }
            console.error("[MovimentacaoController] Erro ao cadastrar:", error);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar movimentação." });
        }
    }

    // 4. ATUALIZAR MOVIMENTAÇÃO (REGISTRA CORREÇÃO DE AUDITORIA)
    static async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const idMovimentacao = Number(req.params.id);
            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({ mensagem: "ID de movimentação inválido. Informe um número inteiro positivo." });
                return;
            }

            const dadosAtualizados = req.body;

            if (dadosAtualizados.quantidade !== undefined) {
                const q = Number(dadosAtualizados.quantidade);
                if (isNaN(q) || q <= 0) {
                    res.status(400).json({ mensagem: "A quantidade deve ser um número positivo maior que zero." });
                    return;
                }
            }

            if (dadosAtualizados.tipo !== undefined) {
                const t = String(dadosAtualizados.tipo).toUpperCase();
                if (t !== 'ENTRADA' && t !== 'SAIDA') {
                    res.status(400).json({ mensagem: "O tipo de movimentação deve ser 'ENTRADA' ou 'SAIDA'." });
                    return;
                }
                dadosAtualizados.tipo = t;
            }

            const sucesso = await Movimentacao.atualizarMovimentacao(idMovimentacao, dadosAtualizados);
            if (!sucesso) {
                res.status(404).json({ mensagem: "Movimentação não encontrada para atualização." });
                return;
            }

            res.status(200).json({ mensagem: "Correção registrada e estoque recalculado com sucesso!" });

        } catch (error: any) {
            const msg = error.message || "";
            if (
                msg.includes("Estoque insuficiente") ||
                msg.includes("não encontrada") ||
                msg.includes("não existe") ||
                msg.includes("desativado")
            ) {
                res.status(422).json({ mensagem: msg });
                return;
            }
            console.error("[MovimentacaoController] Erro ao atualizar:", error);
            res.status(500).json({ mensagem: "Erro interno ao atualizar movimentação." });
        }
    }

    // 5. REMOVER MOVIMENTAÇÃO (REGISTRA ESTORNO DE CORREÇÃO)
    static async remover(req: Request, res: Response): Promise<void> {
        try {
            const idMovimentacao = Number(req.params.id);
            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({ mensagem: "ID de movimentação inválido. Informe um número inteiro positivo." });
                return;
            }

            const removido = await Movimentacao.removerMovimentacao(idMovimentacao);
            if (!removido) {
                res.status(404).json({ mensagem: "Movimentação não encontrada." });
                return;
            }

            res.status(200).json({ mensagem: "Movimentação estornada com sucesso via registro de correção!" });

        } catch (error: any) {
            const msg = error.message || "";
            if (
                msg.includes("Estoque insuficiente") ||
                msg.includes("não encontrada") ||
                msg.includes("desativado")
            ) {
                res.status(422).json({ mensagem: msg });
                return;
            }
            console.error("[MovimentacaoController] Erro ao remover:", error);
            res.status(500).json({ mensagem: "Erro interno ao estornar movimentação." });
        }
    }
}

export default MovimentacaoController;