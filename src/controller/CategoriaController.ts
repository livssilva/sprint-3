import Categoria from "../model/Categoria.js";
import { type Request, type Response } from "express";
import type CategoriaDTO from "../interface/CategoriaDTO.js";

class CategoriaController extends Categoria {

    static async todos(req: Request, res: Response): Promise<void> {
        try {
            const lista = await Categoria.listarCategorias();
            if (lista.length === 0) {
                res.status(204).send();
                return;
            }
            res.status(200).json(lista);
        } catch (error) {
            console.error("[CategoriaController] Erro ao listar categorias:", error);
            res.status(500).json({ mensagem: "Erro interno ao recuperar categorias." });
        }
    }

    static async categoria(req: Request, res: Response): Promise<void> {
        try {
            const idCategoria = parseInt(req.params.id as string);
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const cat = await Categoria.listarCategoria(idCategoria);
            res.status(200).json(cat);
        } catch (error: any) {
            console.error(`[CategoriaController] Erro ao buscar categoria (${req.params.id}):`, error);
            if (error.message?.includes("não encontrada")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }
            res.status(500).json({ mensagem: "Erro interno ao buscar categoria." });
        }
    }

    static async cadastrar(req: Request, res: Response): Promise<void> {
        try {
            const dados: CategoriaDTO = req.body;

            if (!dados.nome || String(dados.nome).trim().length === 0) {
                res.status(400).json({ mensagem: "Campo obrigatório ausente: nome da categoria." });
                return;
            }

            const nomeFormatado = String(dados.nome).trim().toUpperCase();
            if (nomeFormatado.length < 2) {
                res.status(400).json({ mensagem: "O nome da categoria deve ter no mínimo 2 caracteres." });
                return;
            }

            const novaCategoria = new Categoria(nomeFormatado);
            const ok = await Categoria.cadastrarCategoria(novaCategoria);

            if (ok) {
                res.status(201).json({ mensagem: "Categoria cadastrada com sucesso." });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar a categoria." });
            }
        } catch (error: any) {
            console.error("[CategoriaController] Erro ao cadastrar categoria:", error);
            if (error.code === '23505') {
                res.status(409).json({ mensagem: "Já existe uma categoria cadastrada com este nome." });
                return;
            }
            res.status(500).json({ mensagem: "Erro interno ao cadastrar categoria." });
        }
    }

    static async remover(req: Request, res: Response): Promise<void> {
        try {
            const idCategoria = parseInt(req.params.id as string);
            
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const ok = await Categoria.removerCategoria(idCategoria);
            if (ok) {
                res.status(200).json({ mensagem: "Categoria removida com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Categoria não encontrada." });
            }
        } catch (error: any) {
            console.error(`[CategoriaController] Erro ao remover categoria (id: ${req.params.id}):`, error);

            // Erro 23503: Violação de Chave Estrangeira
            if (error.code === '23503') {
                res.status(409).json({ 
                    mensagem: "Não é possível excluir a categoria pois existem produtos vinculados a ela." 
                });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao remover categoria." });
        }
    }

    static async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const idCategoria = parseInt(req.params.id as string);
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const dados: CategoriaDTO = req.body;
            if (!dados.nome || String(dados.nome).trim().length === 0) {
                res.status(400).json({ mensagem: "Campo obrigatório ausente: nome da categoria." });
                return;
            }

            const nomeFormatado = String(dados.nome).trim().toUpperCase();
            const categoria = new Categoria(nomeFormatado);
            categoria.setIdCategoria(idCategoria);

            const ok = await Categoria.atualizarCategoria(categoria);
            if (ok) {
                res.status(200).json({ mensagem: "Categoria atualizada com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Categoria não encontrada." });
            }
        } catch (error: any) {
            console.error(`[CategoriaController] Erro ao atualizar categoria (id: ${req.params.id}):`, error);
            if (error.code === '23505') {
                res.status(409).json({ mensagem: "Já existe uma categoria cadastrada com este nome." });
                return;
            }
            res.status(500).json({ mensagem: "Erro interno ao atualizar categoria." });
        }
    }
}

export default CategoriaController;