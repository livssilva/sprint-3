DROP VIEW IF EXISTS vw_valor_total_estoque;
DROP VIEW IF EXISTS vw_valor_produto_estoque;
DROP VIEW IF EXISTS vw_produtos_reposicao;

DROP TABLE IF EXISTS movimentacao;
DROP TABLE IF EXISTS produto;
DROP TABLE IF EXISTS categoria;


CREATE TABLE categoria (
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR(80) NOT NULL,

    CONSTRAINT pk_categoria PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categoria_nome UNIQUE (nome)
);


CREATE TABLE produto (
    id_produto INTEGER GENERATED ALWAYS AS IDENTITY,
    id_categoria INTEGER NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    preco_unitario NUMERIC(10, 2) NOT NULL,
    quantidade_disponivel INTEGER NOT NULL DEFAULT 0,
    quantidade_minima INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_produto PRIMARY KEY (id_produto),

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria (id_categoria),

    CONSTRAINT uq_produto_codigo UNIQUE (codigo),

    -- Impede o cadastro de preços negativos.
    CONSTRAINT ck_produto_preco
        CHECK (preco_unitario >= 0),

    -- Impede que o estoque atual fique negativo.
    CONSTRAINT ck_produto_quantidade
        CHECK (quantidade_disponivel >= 0),

    -- Impede o cadastro de uma quantidade mínima negativa.
    CONSTRAINT ck_produto_quantidade_minima
        CHECK (quantidade_minima >= 0)
);


CREATE TABLE movimentacao (
    id_movimentacao BIGINT GENERATED ALWAYS AS IDENTITY,
    id_produto INTEGER NOT NULL,
    id_movimentacao_origem BIGINT,
    tipo VARCHAR(10) NOT NULL,
    motivo VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario_praticado NUMERIC(10, 2),
    valor_total NUMERIC(12, 2),
    observacao VARCHAR(255) NOT NULL,
    data_movimentacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_movimentacao
        PRIMARY KEY (id_movimentacao),

    CONSTRAINT fk_movimentacao_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto),

    CONSTRAINT fk_movimentacao_origem
        FOREIGN KEY (id_movimentacao_origem)
        REFERENCES movimentacao (id_movimentacao),

    -- Permite somente movimentações de entrada ou saída.
    CONSTRAINT ck_movimentacao_tipo
        CHECK (
            tipo IN ('ENTRADA', 'SAIDA')
        ),

    -- Permite somente os motivos previstos nas regras de negócio.
    CONSTRAINT ck_movimentacao_motivo
        CHECK (
            motivo IN (
                'RECEBIMENTO',
                'VENDA',
                'USO_INTERNO',
                'PERDA',
                'DANIFICADO',
                'CORRECAO'
            )
        ),

    -- Toda movimentação deve possuir quantidade maior que zero.
    CONSTRAINT ck_movimentacao_quantidade
        CHECK (quantidade > 0),

    -- O preço pode ficar vazio, mas, quando informado, não pode ser negativo.
    CONSTRAINT ck_movimentacao_preco
        CHECK (
            preco_unitario_praticado IS NULL
            OR preco_unitario_praticado >= 0
        ),

    -- O valor total pode ficar vazio, mas, quando informado, não pode ser negativo.
    CONSTRAINT ck_movimentacao_valor
        CHECK (
            valor_total IS NULL
            OR valor_total >= 0
        ),

    -- Em uma venda, o tipo deve ser SAIDA e os valores financeiros são obrigatórios.
    -- Nos demais motivos, esses campos devem permanecer vazios.
    CONSTRAINT ck_movimentacao_venda
        CHECK (
            (
                motivo = 'VENDA'
                AND tipo = 'SAIDA'
                AND preco_unitario_praticado IS NOT NULL
                AND valor_total IS NOT NULL
            )
            OR
            (
                motivo <> 'VENDA'
                AND preco_unitario_praticado IS NULL
                AND valor_total IS NULL
            )
        ),

    -- Confere se o valor total corresponde à quantidade vezes o preço praticado.
    CONSTRAINT ck_movimentacao_calculo_venda
        CHECK (
            motivo <> 'VENDA'
            OR valor_total = quantidade * preco_unitario_praticado
        ),

    -- Um recebimento sempre representa uma entrada no estoque.
    CONSTRAINT ck_movimentacao_recebimento
        CHECK (
            motivo <> 'RECEBIMENTO'
            OR tipo = 'ENTRADA'
        ),

    -- Uma correção deve indicar a movimentação original.
    -- Fora de uma correção, essa referência deve permanecer vazia.
    CONSTRAINT ck_movimentacao_correcao
        CHECK (
            (
                motivo = 'CORRECAO'
                AND id_movimentacao_origem IS NOT NULL
            )
            OR
            (
                motivo <> 'CORRECAO'
                AND id_movimentacao_origem IS NULL
            )
        )
);


CREATE OR REPLACE FUNCTION fn_atualizar_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_quantidade_disponivel INTEGER;
    v_produto_ativo BOOLEAN;
BEGIN
    -- NEW representa a movimentação que está sendo inserida.
    -- FOR UPDATE bloqueia temporariamente o produto durante a operação.
    SELECT
        quantidade_disponivel,
        ativo
    INTO
        v_quantidade_disponivel,
        v_produto_ativo
    FROM produto
    WHERE id_produto = NEW.id_produto
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado.';
    END IF;

    IF v_produto_ativo = FALSE THEN
        RAISE EXCEPTION
            'Não é possível movimentar um produto desativado.';
    END IF;

    IF NEW.tipo = 'ENTRADA' THEN

        -- Uma entrada soma a quantidade recebida ao estoque atual.
        UPDATE produto
        SET quantidade_disponivel =
            quantidade_disponivel + NEW.quantidade
        WHERE id_produto = NEW.id_produto;

    ELSIF NEW.tipo = 'SAIDA' THEN

        -- A verificação ocorre antes da subtração para impedir estoque negativo.
        IF NEW.quantidade > v_quantidade_disponivel THEN
            RAISE EXCEPTION
                'Estoque insuficiente. Quantidade disponível: %.',
                v_quantidade_disponivel;
        END IF;

        -- Uma saída subtrai a quantidade retirada do estoque atual.
        UPDATE produto
        SET quantidade_disponivel =
            quantidade_disponivel - NEW.quantidade
        WHERE id_produto = NEW.id_produto;

    END IF;

    -- Autoriza o trigger a continuar o INSERT da movimentação.
    RETURN NEW;
END;
$$;


CREATE TRIGGER tg_atualizar_estoque
BEFORE INSERT ON movimentacao
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_estoque();


CREATE OR REPLACE FUNCTION fn_proteger_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Qualquer tentativa de UPDATE ou DELETE será interrompida.
    RAISE EXCEPTION
        'Uma movimentação confirmada não pode ser alterada ou excluída. Registre uma correção.';
END;
$$;


CREATE TRIGGER tg_proteger_movimentacao
BEFORE UPDATE OR DELETE ON movimentacao
FOR EACH ROW
EXECUTE FUNCTION fn_proteger_movimentacao();


CREATE VIEW vw_produtos_reposicao AS
SELECT
    p.id_produto,
    p.codigo,
    p.nome,
    p.quantidade_disponivel,
    p.quantidade_minima
FROM produto AS p
WHERE p.ativo = TRUE

    -- O produto precisa de reposição quando o estoque
    -- está igual ou abaixo da quantidade mínima.
    AND p.quantidade_disponivel <= p.quantidade_minima;


CREATE VIEW vw_valor_produto_estoque AS
SELECT
    p.id_produto,
    p.codigo,
    p.nome,
    p.quantidade_disponivel,
    p.preco_unitario,

    -- Calcula o valor armazenado de cada produto.
    p.quantidade_disponivel * p.preco_unitario
        AS valor_em_estoque
FROM produto AS p;


CREATE VIEW vw_valor_total_estoque AS
SELECT
    -- SUM soma o valor armazenado de todos os produtos.
    -- COALESCE retorna zero quando ainda não existem produtos.
    COALESCE(
        SUM(
            p.quantidade_disponivel * p.preco_unitario
        ),
        0
    ) AS valor_total_estoque
FROM produto AS p;


INSERT INTO categoria (nome)
VALUES
    ('Periféricos'),
    ('Armazenamento'),
    ('Componentes'),
    ('Cabos e adaptadores');


INSERT INTO produto (
    id_categoria,
    codigo,
    nome,
    descricao,
    preco_unitario,
    quantidade_minima
)
VALUES
    (
        1,
        'PER-001',
        'Mouse USB',
        'Mouse óptico com conexão USB',
        45.90,
        5
    ),
    (
        1,
        'PER-002',
        'Teclado USB',
        'Teclado padrão ABNT2',
        89.90,
        4
    ),
    (
        2,
        'ARM-001',
        'SSD 480 GB',
        'Unidade SSD SATA de 480 GB',
        249.90,
        3
    ),
    (
        3,
        'COM-001',
        'Memória RAM 8 GB',
        'Memória DDR4 de 8 GB',
        179.90,
        2
    ),
    (
        4,
        'CAB-001',
        'Cabo HDMI',
        'Cabo HDMI de 2 metros',
        39.90,
        6
    );


INSERT INTO movimentacao (
    id_produto,
    tipo,
    motivo,
    quantidade,
    observacao
)
VALUES
    (
        1,
        'ENTRADA',
        'RECEBIMENTO',
        20,
        'Recebimento inicial do fornecedor'
    ),
    (
        2,
        'ENTRADA',
        'RECEBIMENTO',
        10,
        'Recebimento inicial do fornecedor'
    ),
    (
        3,
        'ENTRADA',
        'RECEBIMENTO',
        8,
        'Recebimento inicial do fornecedor'
    ),
    (
        4,
        'ENTRADA',
        'RECEBIMENTO',
        5,
        'Recebimento inicial do fornecedor'
    ),
    (
        5,
        'ENTRADA',
        'RECEBIMENTO',
        12,
        'Recebimento inicial do fornecedor'
    );


INSERT INTO movimentacao (
    id_produto,
    tipo,
    motivo,
    quantidade,
    preco_unitario_praticado,
    valor_total,
    observacao
)
VALUES (
    1,
    'SAIDA',
    'VENDA',
    2,
    45.90,
    91.80,
    'Venda de dois mouses'
);


INSERT INTO movimentacao (
    id_produto,
    tipo,
    motivo,
    quantidade,
    observacao
)
VALUES (
    5,
    'SAIDA',
    'USO_INTERNO',
    1,
    'Cabo utilizado no computador administrativo'
);


-- TESTE INVÁLIDO:
-- Execute separadamente depois do restante do script.
-- O SSD possui somente 8 unidades, portanto a saída deverá ser bloqueada.

/*
INSERT INTO movimentacao (
    id_produto,
    tipo,
    motivo,
    quantidade,
    preco_unitario_praticado,
    valor_total,
    observacao
)
VALUES (
    3,
    'SAIDA',
    'VENDA',
    100,
    249.90,
    24990.00,
    'Teste de retirada sem estoque suficiente'
);
*/


-- Consulta a posição atual do estoque.

SELECT
    codigo,
    nome,
    quantidade_disponivel,
    quantidade_minima
FROM produto
ORDER BY nome;


-- Consulta os produtos que precisam de reposição.

SELECT *
FROM vw_produtos_reposicao
ORDER BY nome;


-- Consulta o valor armazenado de cada produto.

SELECT *
FROM vw_valor_produto_estoque
ORDER BY nome;


-- Consulta o valor financeiro total do estoque.

SELECT *
FROM vw_valor_total_estoque;


-- INNER JOIN relaciona a movimentação aos dados do produto.
-- DESC apresenta primeiro as movimentações mais recentes.

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
ORDER BY m.data_movimentacao DESC;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuario (nome, email, senha, role)
VALUES (
    'ADMINISTRADOR', 
    'admin@techforge.com', 
    '$2a$10$7R0Z4Q6QeR2N1o0bU1qW2.O2gM3K3L3X3Y3Z3A3B3C3D3E3F3G', 
    'admin'
);