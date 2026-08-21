import type CategoriaDTO from "../interface/CategoriaDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Categoria {
    private id_categoria: number = 0;
    private nome: string;

    constructor(_nome: string) {
        this.nome = _nome;
    }

    public getIdCategoria(): number { return this.id_categoria; }
    public setIdCategoria(value: number): void { this.id_categoria = value; }

    public getNome(): string { return this.nome; }
    public setNome(value: string): void { this.nome = value; }

    private static toDTO(categoria: any): CategoriaDTO {
        return {
            id_categoria: categoria.id_categoria,
            nome: categoria.nome
        };
    }

    static async listarCategorias(): Promise<CategoriaDTO[]> {
        try {
            const querySelectCategoria = `SELECT * FROM categoria ORDER BY nome;`;
            const respostaBD = await database.query(querySelectCategoria);
            return respostaBD.rows.map(Categoria.toDTO);
        } catch (error) {
            console.error(`[CategoriaModel] Erro ao listar categorias:`, error);
            throw error;
        }
    }

    static async listarCategoria(id_categoria: number): Promise<CategoriaDTO> {
        try {
            const querySelectCategoria = `SELECT * FROM categoria WHERE id_categoria = $1;`;
            const respostaBD = await database.query(querySelectCategoria, [id_categoria]);

            if (respostaBD.rows.length === 0) {
                throw new Error(`Categoria com ID ${id_categoria} não encontrada.`);
            }

            return Categoria.toDTO(respostaBD.rows[0]);
        } catch (error) {
            console.error(`[CategoriaModel] Erro ao buscar categoria (id: ${id_categoria}):`, error);
            throw error;
        }
    }

    static async cadastrarCategoria(categoria: Categoria): Promise<boolean> {
        try {
            const queryInsertCategoria = `
                INSERT INTO categoria (nome)
                VALUES ($1)
                RETURNING id_categoria;
            `;

            const valores = [categoria.getNome().toUpperCase()];
            const result = await database.query(queryInsertCategoria, valores);

            if (result.rows.length === 0) {
                throw new Error("INSERT não retornou ID.");
            }

            return true;
        } catch (error) {
            console.error(`[CategoriaModel] Erro ao cadastrar categoria:`, error);
            throw error;
        }
    }

    static async removerCategoria(id_categoria: number): Promise<boolean> {
        try {
            const queryDeleteCategoria = `DELETE FROM categoria WHERE id_categoria = $1;`;
            const respostaBD = await database.query(queryDeleteCategoria, [id_categoria]);
            return (respostaBD.rowCount ?? 0) > 0;
        } catch (error) {
            console.error(`[CategoriaModel] Erro ao remover categoria (id: ${id_categoria}):`, error);
            throw error;
        }
    }

    static async atualizarCategoria(categoria: Categoria): Promise<boolean> {
        try {
            const queryAtualizarCategoria = `
                UPDATE categoria SET
                    nome = $1
                WHERE id_categoria = $2;
            `;

            const valores = [
                categoria.getNome().toUpperCase(),
                categoria.getIdCategoria()
            ];

            const respostaBD = await database.query(queryAtualizarCategoria, valores);
            return (respostaBD.rowCount ?? 0) > 0;
        } catch (error) {
            console.error(`[CategoriaModel] Erro ao atualizar categoria (id: ${categoria.getIdCategoria()}):`, error);
            throw error;
        }
    }
}

export default Categoria;