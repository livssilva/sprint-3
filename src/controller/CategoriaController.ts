import Categoria from "../model/Categoria.js";
import { type Request, type Response } from "express";
import type CategoriaDTO from "../interface/CategoriaDTO.js";

class CategoriaController extends Categoria {

    static async todos(req: Request, res: Response) {
        try {
            const lista = await Categoria.listarCategorias();
            if (lista.length === 0) {
                res.status(204).send();
                return;
            }
            res.status(200).json(lista);
        } catch (error) {
            res.status(500).json({ mensagem: "Erro interno ao recuperar categorias." });
        }
    }

    static async categoria(req: Request, res: Response) {
        try {
            const idCategoria = parseInt(req.params.id as string);
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const cat = await Categoria.listarCategoria(idCategoria);
            res.status(200).json(cat);
        } catch (error: any) {
            if (error.message?.includes("não encontrada")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }
            res.status(500).json({ mensagem: "Erro interno ao buscar categoria." });
        }
    }

    static async cadastrar(req: Request, res: Response) {
        try {
            const dados: CategoriaDTO = req.body;

            if (!dados.nome) {
                res.status(400).json({ mensagem: "Campo obrigatório ausente: nome." });
                return;
            }

            const novaCategoria = new Categoria(dados.nome);
            const ok = await Categoria.cadastrarCategoria(novaCategoria);

            if (ok) {
                res.status(201).json({ mensagem: "Categoria cadastrada com sucesso." });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar a categoria." });
            }
        } catch (error) {
            res.status(500).json({ mensagem: "Erro interno ao cadastrar categoria." });
        }
    }

    static async remover(req: Request, res: Response) {
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
        } catch (error) {
            res.status(500).json({ mensagem: "Erro interno ao remover categoria. Verifique se existem produtos associados a ela." });
        }
    }

    static async atualizar(req: Request, res: Response) {
        try {
            const idCategoria = parseInt(req.params.id as string);
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const dados: CategoriaDTO = req.body;
            if (!dados.nome) {
                res.status(400).json({ mensagem: "Campo obrigatório ausente: nome." });
                return;
            }

            const categoria = new Categoria(dados.nome);
            categoria.setIdCategoria(idCategoria);

            const ok = await Categoria.atualizarCategoria(categoria);
            if (ok) {
                res.status(200).json({ mensagem: "Categoria atualizada com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Categoria não encontrada." });
            }
        } catch (error) {
            res.status(500).json({ mensagem: "Erro interno ao atualizar categoria." });
        }
    }
}

export default CategoriaController;