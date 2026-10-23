-- Tabla que usa POST /api/visitas y el gráfico de visitas del dashboard
IF OBJECT_ID('Visitas', 'U') IS NULL
BEGIN
  CREATE TABLE Visitas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Fecha DATETIME NOT NULL CONSTRAINT DF_Visitas_Fecha DEFAULT SYSUTCDATETIME()
  )
END
