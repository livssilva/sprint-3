import Produto from "../model/Produto.js";
import { type Request, type Response } from "express";
import type ProdutoDTO from "../interface/ProdutoDTO.js";

class ProdutoController extends Produto {

    static async todos(req: Request, res: Response) {
        try {
            const listaDeProdutos = await Produto.listarProdutos();

            if (listaDeProdutos.length === 0) {
                res.status(204).send();
                return;
            }

            res.status(200).json(listaDeProdutos);
        } catch (error) {
            console.error(`[ProdutoController] Erro ao listar produtos:`, error);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de produtos." });
        }
    }

    static async produto(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const produto = await Produto.listarProduto(idProduto);
            res.status(200).json(produto);
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao buscar produto (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao recuperar o produto." });
        }
    }

    static async cadastrar(req: Request, res: Response) {
        try {
            const dadosRecebidos: ProdutoDTO = req.body;

            if (
                !dadosRecebidos.id_categoria ||
                !dadosRecebidos.codigo ||
                !dadosRecebidos.nome ||
                dadosRecebidos.preco_unitario === undefined
            ) {
                res.status(400).json({
                    mensagem: "Campos obrigatórios ausentes: id_categoria, codigo, nome e preco_unitario."
                });
                return;
            }

            const novoProduto = new Produto(
                Number(dadosRecebidos.id_categoria),
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                Number(dadosRecebidos.preco_unitario),
                dadosRecebidos.descricao,
                0,
                Number(dadosRecebidos.quantidade_minima ?? 0)
            );

            const result = await Produto.cadastrarProduto(novoProduto);

            if (result) {
                res.status(201).json({ mensagem: "Produto cadastrado com sucesso." });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar o produto." });
            }
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao cadastrar produto:`, error);

            if (error.code === '23505') {
                res.status(409).json({ mensagem: "Já existe um produto com este código cadastrado." });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao cadastrar o produto." });
        }
    }

    static async remover(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const result = await Produto.removerProduto(idProduto);

            if (result) {
                res.status(200).json({ mensagem: "Produto removido com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Produto não encontrado ou já está inativo." });
            }
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao remover produto (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao remover o produto." });
        }
    }

    static async atualizar(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const dadosRecebidos: ProdutoDTO = req.body;

            if (
                !dadosRecebidos.id_categoria ||
                !dadosRecebidos.codigo ||
                !dadosRecebidos.nome ||
                dadosRecebidos.preco_unitario === undefined
            ) {
                res.status(400).json({
                    mensagem: "Campos obrigatórios ausentes: id_categoria, codigo, nome e preco_unitario."
                });
                return;
            }

            const produto = new Produto(
                Number(dadosRecebidos.id_categoria),
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                Number(dadosRecebidos.preco_unitario),
                dadosRecebidos.descricao,
                Number(dadosRecebidos.quantidade_disponivel ?? 0),
                Number(dadosRecebidos.quantidade_minima ?? 0),
                idProduto
            );

            const result = await Produto.atualizarProduto(produto);

            if (result) {
                res.status(200).json({ mensagem: "Produto atualizado com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Produto não encontrado ou já está inativo." });
            }
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao atualizar produto (id: ${req.params.id}):`, error);

            if (error.code === '23505') {
                res.status(409).json({ mensagem: "Este código de produto já está em uso por outro registro." });
                return;
            }

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao atualizar o produto." });
        }
    }
}

export default ProdutoController;