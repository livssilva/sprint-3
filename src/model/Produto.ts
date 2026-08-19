import type ProdutoDTO from "../interface/ProdutoDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Produto {
    // ==================== ATRIBUTOS PRIVADOS ====================
    private id_produto: number = 0;
    private id_categoria: number;
    private codigo: string;
    private nome: string;
    private descricao: string | null;
    private preco_unitario: number;
    private quantidade_disponivel: number;
    private quantidade_minima: number;
    private ativo: boolean = true;

    // ==================== CONSTRUTOR ====================
    constructor(
        _id_categoria: number,
        _codigo: string,
        _nome: string,
        _preco_unitario: number,
        _descricao?: string | null,
        _quantidade_disponivel: number = 0,
        _quantidade_minima: number = 0
    ) {
        this.id_categoria = _id_categoria;
        this.codigo = _codigo;
        this.nome = _nome;
        this.preco_unitario = _preco_unitario;
        this.descricao = _descricao ?? null;
        this.quantidade_disponivel = _quantidade_disponivel;
        this.quantidade_minima = _quantidade_minima;
    }

    // ==================== GETTERS E SETTERS ====================
    public getIdProduto(): number { return this.id_produto; }
    public setIdProduto(value: number): void { this.id_produto = value; }

    public getIdCategoria(): number { return this.id_categoria; }
    public setIdCategoria(value: number): void { this.id_categoria = value; }

    public getCodigo(): string { return this.codigo; }
    public setCodigo(value: string): void { this.codigo = value; }

    public getNome(): string { return this.nome; }
    public setNome(value: string): void { this.nome = value; }

    public getDescricao(): string | null { return this.descricao; }
    public setDescricao(value: string | null): void { this.descricao = value; }

    public getPrecoUnitario(): number { return this.preco_unitario; }
    public setPrecoUnitario(value: number): void { this.preco_unitario = value; }

    public getQuantidadeDisponivel(): number { return this.quantidade_disponivel; }
    public setQuantidadeDisponivel(value: number): void { this.quantidade_disponivel = value; }

    public getQuantidadeMinima(): number { return this.quantidade_minima; }
    public setQuantidadeMinima(value: number): void { this.quantidade_minima = value; }

    public getAtivo(): boolean { return this.ativo; }
    public setAtivo(value: boolean): void { this.ativo = value; }

    // ==================== MÉTODO PRIVADO: toDTO ====================
    private static toDTO(produto: any): ProdutoDTO {
        return {
            id_produto: produto.id_produto,
            id_categoria: produto.id_categoria,
            codigo: produto.codigo,
            nome: produto.nome,
            descricao: produto.descricao,
            preco_unitario: parseFloat(produto.preco_unitario),
            quantidade_disponivel: produto.quantidade_disponivel,
            quantidade_minima: produto.quantidade_minima,
            ativo: produto.ativo,
            data_cadastro: produto.data_cadastro
        };
    }

    // ==================== MÉTODOS ESTÁTICOS ====================

    /**
     * Busca e retorna todos os produtos com status ativo no banco de dados.
     */
    static async listarProdutos(): Promise<ProdutoDTO[]> {
        try {
            const querySelectProduto = `SELECT * FROM produto WHERE ativo = TRUE ORDER BY nome;`;
            const respostaBD = await database.query(querySelectProduto);
            return respostaBD.rows.map(Produto.toDTO);
        } catch (error) {
            console.error(`[ProdutoModel] Erro ao listar produtos:`, error);
            throw error;
        }
    }

    /**
     * Busca e retorna os dados de um produto específico pelo seu ID.
     */
    static async listarProduto(id_produto: number): Promise<ProdutoDTO> {
        try {
            const querySelectProduto = `SELECT * FROM produto WHERE id_produto = $1;`;
            const respostaBD = await database.query(querySelectProduto, [id_produto]);

            if (respostaBD.rows.length === 0) {
                throw new Error(`Produto com ID ${id_produto} não encontrado.`);
            }

            return Produto.toDTO(respostaBD.rows[0]);
        } catch (error) {
            console.error(`[ProdutoModel] Erro ao buscar produto (id: ${id_produto}):`, error);
            throw error;
        }
    }

    /**
     * Cadastra um novo produto no banco de dados.
     */
    static async cadastrarProduto(produto: Produto): Promise<boolean> {
        try {
            const queryInsertProduto = `
                INSERT INTO produto (
                    id_categoria, codigo, nome, descricao, preco_unitario, quantidade_minima
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id_produto;
            `;

            const valores = [
                produto.getIdCategoria(),
                produto.getCodigo().toUpperCase(),
                produto.getNome().toUpperCase(),
                produto.getDescricao(),
                produto.getPrecoUnitario(),
                produto.getQuantidadeMinima()
            ];

            const result = await database.query(queryInsertProduto, valores);

            if (result.rows.length === 0) {
                throw new Error("INSERT não retornou ID — cadastro pode ter falhado silenciosamente.");
            }

            console.info(`[ProdutoModel] Produto cadastrado com sucesso. ID: ${result.rows[0].id_produto}`);
            return true;
        } catch (error) {
            console.error(`[ProdutoModel] Erro ao cadastrar produto:`, error);
            throw error;
        }
    }

    /**
     * Desativa um produto (exclusão lógica).
     */
    static async removerProduto(id_produto: number): Promise<boolean> {
        const client = await database.connect();

        try {
            const produto: ProdutoDTO = await Produto.listarProduto(id_produto);

            if (!produto.ativo) {
                return false;
            }

            await client.query("BEGIN");

            const result = await client.query(
                `UPDATE produto SET ativo = FALSE WHERE id_produto = $1`,
                [id_produto]
            );

            await client.query("COMMIT");
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            await client.query("ROLLBACK");
            console.error(`[ProdutoModel] Erro ao remover produto (id: ${id_produto}):`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Atualiza os dados cadastrais de um produto.
     */
    static async atualizarProduto(produto: Produto): Promise<boolean> {
        try {
            const produtoConsulta: ProdutoDTO = await Produto.listarProduto(produto.getIdProduto());

            if (!produtoConsulta.ativo) {
                return false;
            }

            const queryAtualizarProduto = `
                UPDATE produto SET
                    id_categoria      = $1,
                    codigo            = $2,
                    nome              = $3,
                    descricao         = $4,
                    preco_unitario    = $5,
                    quantidade_minima = $6
                WHERE id_produto = $7
            `;

            const valores = [
                produto.getIdCategoria(),
                produto.getCodigo().toUpperCase(),
                produto.getNome().toUpperCase(),
                produto.getDescricao(),
                produto.getPrecoUnitario(),
                produto.getQuantidadeMinima(),
                produto.getIdProduto()
            ];

            const respostaBD = await database.query(queryAtualizarProduto, valores);
            return (respostaBD.rowCount ?? 0) > 0;
        } catch (error) {
            console.error(`[ProdutoModel] Erro ao atualizar produto (id: ${produto.getIdProduto()}):`, error);
            throw error;
        }
    }
}

export default Produto;