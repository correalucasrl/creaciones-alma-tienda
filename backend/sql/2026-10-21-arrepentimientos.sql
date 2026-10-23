-- Solicitudes del botón de arrepentimiento (Res. 424/2020)
IF OBJECT_ID('Arrepentimientos', 'U') IS NULL
BEGIN
  CREATE TABLE Arrepentimientos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL UNIQUE,
    Nombre NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    Telefono NVARCHAR(30) NULL,
    OrdenId INT NULL,
    Motivo NVARCHAR(1000) NULL,
    FechaCreacion DATETIME NOT NULL CONSTRAINT DF_Arrepentimientos_Fecha DEFAULT SYSUTCDATETIME()
  )
END
