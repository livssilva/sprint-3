import { DatabaseModel } from "./DatabaseModel.js";
import type {
    ProdutoReposicaoDTO,
    ValorProdutoEstoqueDTO,
    ValorTotalEstoqueDTO,
    PosicaoEstoqueDTO,
    MovimentacaoHistoricoDTO
} from "../interface/EstoqueDTO.js";

const database = new DatabaseModel().pool;

export class Estoque {

    /**
     * Consulta produtos que necessitam de reposição (estoque <= mínimo)
     * Baseado na View vw_produtos_reposicao do banco de dados
     */
    static async listarProdutosReposicao(): Promise<ProdutoReposicaoDTO[]> {
        try {
            const query = `SELECT id_produto, codigo, nome, quantidade_disponivel, quantidade_minima FROM vw_produtos_reposicao ORDER BY nome;`;
            const resposta = await database.query(query);
            return resposta.rows.map((row: any) => ({
                id_produto: Number(row.id_produto),
                codigo: row.codigo,
                nome: row.nome,
                quantidade_disponivel: Number(row.quantidade_disponivel),
                quantidade_minima: Number(row.quantidade_minima)
            }));
        } catch (error) {
            console.error(`[EstoqueModel] Erro ao listar produtos para reposição:`, error);
            throw error;
        }
    }

    /**
     * Consulta o valor financeiro armazenado de cada produto (quantidade * preco)
     * Baseado na View vw_valor_produto_estoque do banco de dados
     */
    static async listarValorProdutosEstoque(): Promise<ValorProdutoEstoqueDTO[]> {
        try {
            const query = `SELECT id_produto, codigo, nome, quantidade_disponivel, preco_unitario, valor_em_estoque FROM vw_valor_produto_estoque ORDER BY nome;`;
            const resposta = await database.query(query);
            return resposta.rows.map((row: any) => ({
                id_produto: Number(row.id_produto),
                codigo: row.codigo,
                nome: row.nome,
                quantidade_disponivel: Number(row.quantidade_disponivel),
                preco_unitario: parseFloat(row.preco_unitario),
                valor_em_estoque: parseFloat(row.valor_em_estoque)
            }));
        } catch (error) {
            console.error(`[EstoqueModel] Erro ao listar valor por produto:`, error);
            throw error;
        }
    }

    /**
     * Consulta o valor financeiro total de todo o estoque armazenado
     * Baseado na View vw_valor_total_estoque do banco de dados
     */
    static async consultarValorTotalEstoque(): Promise<ValorTotalEstoqueDTO> {
        try {
            const query = `SELECT valor_total_estoque FROM vw_valor_total_estoque;`;
            const resposta = await database.query(query);
            const total = resposta.rows[0]?.valor_total_estoque ?? 0;
            return {
                valor_total_estoque: parseFloat(total)
            };
        } catch (error) {
            console.error(`[EstoqueModel] Erro ao consultar valor total do estoque:`, error);
            throw error;
        }
    }

    /**
     * Consulta a posição atual de estoque de todos os produtos ativos
     */
    static async consultarPosicaoAtual(): Promise<PosicaoEstoqueDTO[]> {
        try {
            const query = `
                SELECT id_produto, codigo, nome, quantidade_disponivel, quantidade_minima 
                FROM produto 
                WHERE ativo = TRUE 
                ORDER BY nome;
            `;
            const resposta = await database.query(query);
            return resposta.rows.map((row: any) => ({
                id_produto: Number(row.id_produto),
                codigo: row.codigo,
                nome: row.nome,
                quantidade_disponivel: Number(row.quantidade_disponivel),
                quantidade_minima: Number(row.quantidade_minima)
            }));
        } catch (error) {
            console.error(`[EstoqueModel] Erro ao consultar posição atual do estoque:`, error);
            throw error;
        }
    }

    /**
     * Consulta o histórico detalhado de movimentações com os dados dos produtos
     * Permite filtros opcionais por produto, tipo e período de datas
     */
    static async consultarHistorico(filtros?: {
        id_produto?: number;
        tipo?: string;
        dataInicio?: string;
        dataFim?: string;
    }): Promise<MovimentacaoHistoricoDTO[]> {
        try {
            let query = `
                SELECT
                    m.id_movimentacao,
                    p.codigo,
                    p.nome AS produto,
                    m.tipo,
                    m.motivo,
                    m.quantidade,
                    m.preco_unitario_praticado,
                    m.valor_total,
                    m.data_movimentacao,
                    m.observacao
                FROM movimentacao AS m
                INNER JOIN produto AS p
                    ON p.id_produto = m.id_produto
                WHERE 1=1
            `;
            const valores: any[] = [];
            let paramIndex = 1;

            if (filtros?.id_produto) {
                query += ` AND m.id_produto = $${paramIndex++}`;
                valores.push(filtros.id_produto);
            }

            if (filtros?.tipo && (filtros.tipo === 'ENTRADA' || filtros.tipo === 'SAIDA')) {
                query += ` AND m.tipo = $${paramIndex++}`;
                valores.push(filtros.tipo);
            }

            if (filtros?.dataInicio) {
                query += ` AND m.data_movimentacao >= $${paramIndex++}`;
                valores.push(filtros.dataInicio);
            }

            if (filtros?.dataFim) {
                query += ` AND m.data_movimentacao <= $${paramIndex++}`;
                valores.push(filtros.dataFim);
            }

            query += ` ORDER BY m.data_movimentacao DESC;`;

            const resposta = await database.query(query, valores);
            return resposta.rows.map((row: any) => ({
                id_movimentacao: Number(row.id_movimentacao),
                codigo: row.codigo,
                produto: row.produto,
                tipo: row.tipo,
                motivo: row.motivo,
                quantidade: Number(row.quantidade),
                preco_unitario_praticado: row.preco_unitario_praticado ? parseFloat(row.preco_unitario_praticado) : null,
                valor_total: row.valor_total ? parseFloat(row.valor_total) : null,
                data_movimentacao: row.data_movimentacao,
                observacao: row.observacao
            }));
        } catch (error) {
            console.error(`[EstoqueModel] Erro ao consultar histórico de movimentações:`, error);
            throw error;
        }
    }
}

export default Estoque;
