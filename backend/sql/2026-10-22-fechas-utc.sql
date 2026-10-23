-- Pasa todas las fechas automáticas a UTC.
--
-- Hasta ahora se guardaban con GETDATE(), que devuelve la hora LOCAL del servidor de base de
-- datos, y la librería mssql las leía como si fueran UTC: todo se veía 3 horas antes.
-- Este script:
--   1. Cambia el valor por defecto de esas columnas a SYSUTCDATETIME().
--   2. Corrige los registros existentes sumándoles la diferencia entre UTC y la hora local
--      del servidor (en Argentina, +3 horas).
--
-- IMPORTANTE: el paso 2 asume que el servidor de base de datos estaba en la hora local donde
-- se cargaron los datos. Se corre UNA sola vez por base; la tabla MigracionesAplicadas evita
-- que se aplique dos veces. En una base nueva (sin datos viejos) no hace daño correrlo.

IF OBJECT_ID('MigracionesAplicadas', 'U') IS NULL
BEGIN
  CREATE TABLE MigracionesAplicadas (
    Nombre NVARCHAR(100) PRIMARY KEY,
    FechaAplicada DATETIME NOT NULL CONSTRAINT DF_MigracionesAplicadas_Fecha DEFAULT SYSUTCDATETIME()
  )
END

IF NOT EXISTS (SELECT 1 FROM MigracionesAplicadas WHERE Nombre = '2026-10-22-fechas-utc')
BEGIN
  SET XACT_ABORT ON
  BEGIN TRANSACTION

  -- Diferencia actual entre UTC y la hora local del servidor, en minutos (Argentina: 180)
  DECLARE @minutos INT = DATEDIFF(MINUTE, GETDATE(), GETUTCDATE())
  -- Se redondea a múltiplos de 15 minutos para que el desfase de milisegundos entre las dos llamadas no afecte
  SET @minutos = ROUND(@minutos / 15.0, 0) * 15

  DECLARE @columnas TABLE (Tabla SYSNAME, Columna SYSNAME)
  INSERT INTO @columnas VALUES
    ('Ordenes', 'FechaCreacion'),
    ('Usuarios', 'FechaRegistro'),
    ('Productos', 'FechaCreacion'),
    ('Testimonios', 'FechaCreacion'),
    ('Visitas', 'Fecha'),
    ('Arrepentimientos', 'FechaCreacion'),
    ('TrabajosGaleria', 'FechaCreacion')

  DECLARE @tabla SYSNAME, @columna SYSNAME, @restriccion SYSNAME, @sql NVARCHAR(MAX)
  DECLARE cursor_columnas CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla, Columna FROM @columnas
  OPEN cursor_columnas
  FETCH NEXT FROM cursor_columnas INTO @tabla, @columna

  WHILE @@FETCH_STATUS = 0
  BEGIN
    IF COL_LENGTH(@tabla, @columna) IS NOT NULL
    BEGIN
      -- 1. Reemplazar el valor por defecto (los nombres viejos los generó SQL Server)
      SELECT @restriccion = dc.name
      FROM sys.default_constraints dc
      JOIN sys.columns c ON c.default_object_id = dc.object_id
      WHERE c.object_id = OBJECT_ID(@tabla) AND c.name = @columna

      IF @restriccion IS NOT NULL
      BEGIN
        SET @sql = N'ALTER TABLE ' + QUOTENAME(@tabla) + N' DROP CONSTRAINT ' + QUOTENAME(@restriccion)
        EXEC sp_executesql @sql
      END

      SET @sql = N'ALTER TABLE ' + QUOTENAME(@tabla) + N' ADD CONSTRAINT ' + QUOTENAME('DF_' + @tabla + '_' + @columna)
               + N' DEFAULT SYSUTCDATETIME() FOR ' + QUOTENAME(@columna)
      EXEC sp_executesql @sql

      -- 2. Corregir los registros existentes
      SET @sql = N'UPDATE ' + QUOTENAME(@tabla) + N' SET ' + QUOTENAME(@columna) + N' = DATEADD(MINUTE, @m, ' + QUOTENAME(@columna) + N')'
               + N' WHERE ' + QUOTENAME(@columna) + N' IS NOT NULL'
      EXEC sp_executesql @sql, N'@m INT', @m = @minutos

      SET @restriccion = NULL
    END

    FETCH NEXT FROM cursor_columnas INTO @tabla, @columna
  END

  CLOSE cursor_columnas
  DEALLOCATE cursor_columnas

  INSERT INTO MigracionesAplicadas (Nombre) VALUES ('2026-10-22-fechas-utc')
  COMMIT TRANSACTION

  PRINT 'Fechas corridas ' + CAST(@minutos AS NVARCHAR(10)) + ' minutos y valores por defecto cambiados a SYSUTCDATETIME()'
END
ELSE
  PRINT 'La migración 2026-10-22-fechas-utc ya estaba aplicada'
