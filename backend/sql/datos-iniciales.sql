-- Datos iniciales para una base NUEVA (correr después de esquema-completo.sql).
-- La tienda arranca CERRADA al público (sitio_abierto = 0): se abre desde el panel, en Configuración.
-- Los administradores se crean con: node scripts/crear-admin.js (ver DEPLOY.md).

-- Configuración del sitio (los datos de contacto y de transferencia quedan vacíos: los completa el admin desde el panel)
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'admin_email') INSERT INTO Configuracion (Clave, Valor) VALUES (N'admin_email', N'')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'correo_cp_origen') INSERT INTO Configuracion (Clave, Valor) VALUES (N'correo_cp_origen', N'')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'correo_customer_id') INSERT INTO Configuracion (Clave, Valor) VALUES (N'correo_customer_id', N'')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'email_contacto') INSERT INTO Configuracion (Clave, Valor) VALUES (N'email_contacto', N'hola@creacionesalma.com.ar')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'hero_imagen_1') INSERT INTO Configuracion (Clave, Valor) VALUES (N'hero_imagen_1', N'https://res.cloudinary.com/yjltk9ci/image/upload/v1789445772/d9aqmbmy80anjyljgubi.jpg')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'hero_imagen_2') INSERT INTO Configuracion (Clave, Valor) VALUES (N'hero_imagen_2', N'https://res.cloudinary.com/yjltk9ci/image/upload/v1789445734/txiolwpdpztgddlbdwns.jpg')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'hero_imagen_3') INSERT INTO Configuracion (Clave, Valor) VALUES (N'hero_imagen_3', N'https://res.cloudinary.com/yjltk9ci/image/upload/v1789445749/txt56b0ivdqwlwhkyedp.jpg')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'hero_subtitulo') INSERT INTO Configuracion (Clave, Valor) VALUES (N'hero_subtitulo', N'Papelería creativa, fotos Polaroid, stickers e impresiones personalizadas hechas con amor ??')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'instagram_url') INSERT INTO Configuracion (Clave, Valor) VALUES (N'instagram_url', N'https://instagram.com/creacionesalma23_')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'instagram_usuario') INSERT INTO Configuracion (Clave, Valor) VALUES (N'instagram_usuario', N'@creacionesalma23_')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'meta_mensual') INSERT INTO Configuracion (Clave, Valor) VALUES (N'meta_mensual', N'1000000')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'paquete_alto_cm') INSERT INTO Configuracion (Clave, Valor) VALUES (N'paquete_alto_cm', N'10')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'paquete_ancho_cm') INSERT INTO Configuracion (Clave, Valor) VALUES (N'paquete_ancho_cm', N'20')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'paquete_largo_cm') INSERT INTO Configuracion (Clave, Valor) VALUES (N'paquete_largo_cm', N'30')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'paquete_peso_gramos') INSERT INTO Configuracion (Clave, Valor) VALUES (N'paquete_peso_gramos', N'500')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'sitio_abierto') INSERT INTO Configuracion (Clave, Valor) VALUES (N'sitio_abierto', N'0')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'texto_envios') INSERT INTO Configuracion (Clave, Valor) VALUES (N'texto_envios', N'Envíos a todo el país por Correo Argentino')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'texto_retiro') INSERT INTO Configuracion (Clave, Valor) VALUES (N'texto_retiro', N'Retiro en zona oeste (consultar)')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'transferencia_alias') INSERT INTO Configuracion (Clave, Valor) VALUES (N'transferencia_alias', N'')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'transferencia_titular') INSERT INTO Configuracion (Clave, Valor) VALUES (N'transferencia_titular', N'')
IF NOT EXISTS (SELECT 1 FROM Configuracion WHERE Clave = N'whatsapp_numero') INSERT INTO Configuracion (Clave, Valor) VALUES (N'whatsapp_numero', N'')

-- Categorías
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Slug = N'fotos-polaroid') INSERT INTO Categorias (Nombre, Slug, IconoUrl, Activo) VALUES (N'Fotos Polaroid', N'fotos-polaroid', N'', 1)
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Slug = N'albumes') INSERT INTO Categorias (Nombre, Slug, IconoUrl, Activo) VALUES (N'Álbumes', N'albumes', N'', 1)
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Slug = N'stickers') INSERT INTO Categorias (Nombre, Slug, IconoUrl, Activo) VALUES (N'Stickers', N'stickers', N'', 1)
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Slug = N'impresiones') INSERT INTO Categorias (Nombre, Slug, IconoUrl, Activo) VALUES (N'Impresiones', N'impresiones', N'', 1)
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Slug = N'papeleria-personalizada') INSERT INTO Categorias (Nombre, Slug, IconoUrl, Activo) VALUES (N'Papelería personalizada', N'papeleria-personalizada', N'', 0)

-- Ocasiones ("Comprá por ocasión")
IF NOT EXISTS (SELECT 1 FROM Ocasiones WHERE Slug = N'cumpleanos') INSERT INTO Ocasiones (Nombre, Slug, Descripcion, ImagenUrl, Icono, Orden, Activo) VALUES (N'Cumpleaños', N'cumpleanos', N'Regalos únicos para festejar a alguien especial.', NULL, N'bi-cake2', 1, 1)
IF NOT EXISTS (SELECT 1 FROM Ocasiones WHERE Slug = N'dia-de-la-madre') INSERT INTO Ocasiones (Nombre, Slug, Descripcion, ImagenUrl, Icono, Orden, Activo) VALUES (N'Día de la Madre', N'dia-de-la-madre', N'Recuerdos para decirle cuánto la querés.', NULL, N'bi-flower1', 2, 1)
IF NOT EXISTS (SELECT 1 FROM Ocasiones WHERE Slug = N'dia-del-padre') INSERT INTO Ocasiones (Nombre, Slug, Descripcion, ImagenUrl, Icono, Orden, Activo) VALUES (N'Día del Padre', N'dia-del-padre', N'Álbumes y fotos para el mejor papá.', NULL, N'bi-emoji-sunglasses', 3, 1)
IF NOT EXISTS (SELECT 1 FROM Ocasiones WHERE Slug = N'aniversarios') INSERT INTO Ocasiones (Nombre, Slug, Descripcion, ImagenUrl, Icono, Orden, Activo) VALUES (N'Aniversarios', N'aniversarios', N'Para celebrar una historia juntos.', NULL, N'bi-hearts', 4, 1)
IF NOT EXISTS (SELECT 1 FROM Ocasiones WHERE Slug = N'egresados') INSERT INTO Ocasiones (Nombre, Slug, Descripcion, ImagenUrl, Icono, Orden, Activo) VALUES (N'Egresados', N'egresados', N'Recuerdos del viaje y del último año.', NULL, N'bi-mortarboard', 5, 1)
IF NOT EXISTS (SELECT 1 FROM Ocasiones WHERE Slug = N'souvenirs') INSERT INTO Ocasiones (Nombre, Slug, Descripcion, ImagenUrl, Icono, Orden, Activo) VALUES (N'Souvenirs', N'souvenirs', N'Detalles personalizados para tus invitados.', NULL, N'bi-gift', 6, 1)

-- La conversión de fechas a UTC ya viene incluida en el esquema: se marca como aplicada
IF NOT EXISTS (SELECT 1 FROM MigracionesAplicadas WHERE Nombre = '2026-10-22-fechas-utc') INSERT INTO MigracionesAplicadas (Nombre) VALUES ('2026-10-22-fechas-utc')
