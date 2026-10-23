-- Marca si una orden ya descontó stock de los productos.
-- Las órdenes existentes quedan en 0 porque se crearon antes de que el checkout descontara stock,
-- así que cancelarlas no "devuelve" unidades que nunca se restaron.
IF COL_LENGTH('Ordenes', 'StockDescontado') IS NULL
BEGIN
  ALTER TABLE Ordenes ADD StockDescontado BIT NOT NULL CONSTRAINT DF_Ordenes_StockDescontado DEFAULT 0
END
