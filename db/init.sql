-- Tabela principal de medidas (com otimizações)
CREATE TABLE IF NOT EXISTS measures (
    measure_uuid VARCHAR(36) PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL COMMENT 'Código do cliente conforme requisito',
    measure_datetime DATETIME NOT NULL COMMENT 'Data/hora da medição',
    measure_type ENUM('WATER', 'GAS') NOT NULL COMMENT 'Tipo conforme especificação',
    initial_value INT UNSIGNED COMMENT 'Valor lido pela IA (não negativo)',
    confirmed_value INT UNSIGNED COMMENT 'Valor confirmado (não negativo)',
    is_confirmed BOOLEAN DEFAULT FALSE COMMENT 'Flag de confirmação',
    image_url VARCHAR(255) COMMENT 'URL temporária da imagem',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices otimizados para as consultas frequentes
    INDEX idx_customer_type (customer_code, measure_type),
    INDEX idx_datetime (measure_datetime),
    INDEX idx_confirmation_status (is_confirmed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela de medições de água/gás';

-- Dados de teste (ajustados para os cenários do requisito)
INSERT IGNORE INTO measures 
    (measure_uuid, customer_code, measure_datetime, measure_type, initial_value, confirmed_value, is_confirmed, image_url)
VALUES
    -- Medição confirmada (para testes de GET /list)
    ('uuid-teste-123', 'cliente-1', NOW() - INTERVAL 1 DAY, 'WATER', 100, 100, true, 'http://storage.com/img1.jpg'),
    
    -- Medição não confirmada (para testes de PATCH /confirm)
    ('uuid-teste-456', 'cliente-1', NOW(), 'GAS', 50, NULL, false, 'http://storage.com/img2.jpg'),
    
    -- Medição antiga (para testes de duplicidade)
    ('uuid-teste-789', 'cliente-2', NOW() - INTERVAL 1 MONTH, 'WATER', 75, 80, true, 'http://storage.com/img3.jpg');