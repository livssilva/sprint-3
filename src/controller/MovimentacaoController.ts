import Movimentacao from "../model/Movimentacao.js";
import { type Request, type Response } from "express";
import type MovimentacaoDTO from "../interface/MovimentacaoDTO.js";

class MovimentacaoController extends Movimentacao {

    static async todos(req: Request, res: Response) {
        try {
            const lista = await Movimentacao.listarMovimentacoes();
            if (lista.length === 0) {
                res.status(204).send();
                return;
            }
            res.status(200).json(lista);
        } catch (error) {
            res.status(500).json({ mensagem: "Erro interno ao listar movimentações." });
        }
    }

    static async porProduto(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.idProduto as string);
            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID de produto inválido." });
                return;
            }

            const lista = await Movimentacao.listarPorProduto(idProduto);
            if (lista.length === 0) {
                res.status(204).send();
                return;
            }
            res.status(200).json(lista);
        } catch (error) {
            res.status(500).json({ mensagem: "Erro interno ao buscar histórico do produto." });
        }
    }

    static async cadastrar(req: Request, res: Response) {
        try {
            const dados: MovimentacaoDTO = req.body;

            if (!dados.id_produto || !dados.tipo || !dados.quantidade) {
                res.status(400).json({
                    mensagem: "Campos obrigatórios ausentes: id_produto, tipo ('ENTRADA'|'SAIDA') e quantidade."
                });
                return;
            }

            if (dados.tipo !== 'ENTRADA' && dados.tipo !== 'SAIDA') {
                res.status(400).json({ mensagem: "O tipo deve ser 'ENTRADA' ou 'SAIDA'." });
                return;
            }

            if (dados.quantidade <= 0) {
                res.status(400).json({ mensagem: "A quantidade deve ser maior que zero." });
                return;
            }

            const novaMov = new Movimentacao(
                dados.id_produto,
                dados.tipo,
                dados.quantidade,
                dados.observacao
            );

            const ok = await Movimentacao.cadastrarMovimentacao(novaMov);

            if (ok) {
                res.status(201).json({ mensagem: "Movimentação registrada com sucesso." });
            } else {
                res.status(400).json({ mensagem: "Não foi possível registrar a movimentação." });
            }
        } catch (error: any) {
            if (error.message?.includes("Estoque insuficiente")) {
                res.status(422).json({ mensagem: error.message });
                return;
            }
            res.status(500).json({ mensagem: "Erro interno ao registrar movimentação." });
        }
    }
}

export default MovimentacaoController;