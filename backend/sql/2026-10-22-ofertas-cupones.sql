-- Ofertas por producto, cupones de descuento, descuento por transferencia y envío gratis

-- Precio de oferta: si está cargado (y es menor al precio normal) se cobra ese precio,
-- y en el sitio se muestra el normal tachado con el % OFF. OfertaHasta es opcional (UTC).
IF COL_LENGTH('Productos', 'PrecioOferta') IS NULL
  ALTER TABLE Productos ADD PrecioOferta DECIMAL(10, 2) NULL
IF COL_LENGTH('Productos', 'OfertaHasta') IS NULL
  ALTER TABLE Productos ADD OfertaHasta DATETIME NULL

IF OBJECT_ID('Cupones', 'U') IS NULL
BEGIN
  CREATE TABLE Cupones (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL CONSTRAINT UQ_Cupones_Codigo UNIQUE,
    Descripcion NVARCHAR(200) NULL,
    Tipo NVARCHAR(20) NOT NULL CONSTRAINT CK_Cupones_Tipo CHECK (Tipo IN ('porcentaje', 'monto')),
    Valor DECIMAL(10, 2) NOT NULL CONSTRAINT CK_Cupones_Valor CHECK (Valor > 0),
    MinimoCompra DECIMAL(10, 2) NULL,
    FechaInicio DATETIME NULL,
    FechaFin DATETIME NULL,
    UsosMaximos INT NULL,
    Usos INT NOT NULL CONSTRAINT DF_Cupones_Usos DEFAULT 0,
    Activo BIT NOT NULL CONSTRAINT DF_Cupones_Activo DEFAULT 1,
    FechaCreacion DATETIME NOT NULL CONSTRAINT DF_Cupones_FechaCreacion DEFAULT SYSUTCDATETIME()
  )
END

-- Desglose del total de cada pedido
IF COL_LENGTH('Ordenes', 'Subtotal') IS NULL
  ALTER TABLE Ordenes ADD Subtotal DECIMAL(10, 2) NULL
IF COL_LENGTH('Ordenes', 'CuponId') IS NULL
  ALTER TABLE Ordenes ADD CuponId INT NULL
IF COL_LENGTH('Ordenes', 'CuponCodigo') IS NULL
  ALTER TABLE Ordenes ADD CuponCodigo NVARCHAR(40) NULL
IF COL_LENGTH('Ordenes', 'DescuentoCupon') IS NULL
  ALTER TABLE Ordenes ADD DescuentoCupon DECIMAL(10, 2) NULL
IF COL_LENGTH('Ordenes', 'DescuentoTransferencia') IS NULL
  ALTER TABLE Ordenes ADD DescuentoTransferencia DECIMAL(10, 2) NULL
