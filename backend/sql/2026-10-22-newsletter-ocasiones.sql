-- Newsletter con cupón de bienvenida y compras por ocasión

-- Suscriptores del newsletter. Cada uno recibe un cupón personal de un solo uso.
-- TokenBaja permite darse de baja desde el link del mail sin iniciar sesión.
IF OBJECT_ID('Suscriptores', 'U') IS NULL
BEGIN
  CREATE TABLE Suscriptores (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(150) NOT NULL CONSTRAINT UQ_Suscriptores_Email UNIQUE,
    Origen NVARCHAR(30) NULL,
    CuponId INT NULL,
    TokenBaja NVARCHAR(64) NOT NULL,
    Activo BIT NOT NULL CONSTRAINT DF_Suscriptores_Activo DEFAULT 1,
    FechaAlta DATETIME NOT NULL CONSTRAINT DF_Suscriptores_FechaAlta DEFAULT SYSUTCDATETIME(),
    FechaBaja DATETIME NULL
  )
END

-- Ocasiones para regalar (cumpleaños, Día de la Madre...) y qué productos sirven para cada una
IF OBJECT_ID('Ocasiones', 'U') IS NULL
BEGIN
  CREATE TABLE Ocasiones (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(80) NOT NULL,
    Slug NVARCHAR(80) NOT NULL CONSTRAINT UQ_Ocasiones_Slug UNIQUE,
    Descripcion NVARCHAR(300) NULL,
    ImagenUrl NVARCHAR(255) NULL,
    Icono NVARCHAR(40) NULL,
    Orden INT NOT NULL CONSTRAINT DF_Ocasiones_Orden DEFAULT 0,
    Activo BIT NOT NULL CONSTRAINT DF_Ocasiones_Activo DEFAULT 1
  )

  -- Ocasiones sugeridas para arrancar (se pueden editar o desactivar desde el admin)
  INSERT INTO Ocasiones (Nombre, Slug, Descripcion, Icono, Orden) VALUES
    ('Cumpleaños', 'cumpleanos', 'Regalos únicos para festejar a alguien especial.', 'bi-cake2', 1),
    ('Día de la Madre', 'dia-de-la-madre', 'Recuerdos para decirle cuánto la querés.', 'bi-flower1', 2),
    ('Día del Padre', 'dia-del-padre', 'Álbumes y fotos para el mejor papá.', 'bi-emoji-sunglasses', 3),
    ('Aniversarios', 'aniversarios', 'Para celebrar una historia juntos.', 'bi-hearts', 4),
    ('Egresados', 'egresados', 'Recuerdos del viaje y del último año.', 'bi-mortarboard', 5),
    ('Souvenirs', 'souvenirs', 'Detalles personalizados para tus invitados.', 'bi-gift', 6)
END

IF OBJECT_ID('ProductoOcasiones', 'U') IS NULL
BEGIN
  CREATE TABLE ProductoOcasiones (
    ProductoId INT NOT NULL,
    OcasionId INT NOT NULL,
    CONSTRAINT PK_ProductoOcasiones PRIMARY KEY (ProductoId, OcasionId)
  )
END
