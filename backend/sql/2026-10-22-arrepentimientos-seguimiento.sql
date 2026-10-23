-- Seguimiento de las solicitudes de arrepentimiento desde el panel de admin
IF COL_LENGTH('Arrepentimientos', 'Estado') IS NULL
BEGIN
  ALTER TABLE Arrepentimientos ADD Estado NVARCHAR(20) NOT NULL CONSTRAINT DF_Arrepentimientos_Estado DEFAULT 'Pendiente'
END

IF COL_LENGTH('Arrepentimientos', 'NotasAdmin') IS NULL
BEGIN
  ALTER TABLE Arrepentimientos ADD NotasAdmin NVARCHAR(1000) NULL
END
