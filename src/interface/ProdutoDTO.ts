export default interface ProdutoDTO {
    id_produto?: number;
    id_categoria: number;
    codigo: string;
    nome: string;
    descricao?: string | null;
    preco_unitario: number;
    quantidade_disponivel?: number;
    quantidade_minima?: number;
    ativo?: boolean;
    data_cadastro?: Date | string;
}