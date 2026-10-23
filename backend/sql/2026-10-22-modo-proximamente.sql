-- "Modo próximamente": el sitio arranca cerrado al público. Solo los admin pueden verlo y comprar
-- hasta que se active "Sitio abierto al público" en Configuración del panel
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = 'sitio_abierto')
  INSERT INTO Configuracion (Clave, Valor) VALUES ('sitio_abierto', '0')
