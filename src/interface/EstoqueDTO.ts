export interface ProdutoReposicaoDTO {
    id_produto: number;
    codigo: string;
    nome: string;
    quantidade_disponivel: number;
    quantidade_minima: number;
}

export interface ValorProdutoEstoqueDTO {
    id_produto: number;
    codigo: string;
    nome: string;
    quantidade_disponivel: number;
    preco_unitario: number;
    valor_em_estoque: number;
}

export interface ValorTotalEstoqueDTO {
    valor_total_estoque: number;
}

export interface PosicaoEstoqueDTO {
    id_produto?: number;
    codigo: string;
    nome: string;
    quantidade_disponivel: number;
    quantidade_minima: number;
}

export interface MovimentacaoHistoricoDTO {
    id_movimentacao: number;
    codigo: string;
    produto: string;
    tipo: 'ENTRADA' | 'SAIDA';
    motivo: string;
    quantidade: number;
    preco_unitario_praticado: number | null;
    valor_total: number | null;
    data_movimentacao: string | Date;
    observacao: string;
}
