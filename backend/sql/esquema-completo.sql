-- Esquema completo de la base de Creaciones Alma, para crear una base NUEVA (ej: Azure SQL).
-- Generado desde la base local. Incluye todos los cambios de backend/sql/*.sql hasta la fecha:
-- en una base creada con este script NO hay que correr esos archivos.
-- Después de este script, correr datos-iniciales.sql.

IF OBJECT_ID('Arrepentimientos', 'U') IS NULL
CREATE TABLE [Arrepentimientos] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Codigo] NVARCHAR(40) NOT NULL,
  [Nombre] NVARCHAR(100) NOT NULL,
  [Email] NVARCHAR(150) NOT NULL,
  [Telefono] NVARCHAR(30) NULL,
  [OrdenId] INT NULL,
  [Motivo] NVARCHAR(1000) NULL,
  [FechaCreacion] DATETIME NOT NULL CONSTRAINT [DF_Arrepentimientos_FechaCreacion] DEFAULT (sysutcdatetime()),
  [Estado] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Arrepentimientos_Estado] DEFAULT ('Pendiente'),
  [NotasAdmin] NVARCHAR(1000) NULL,
  PRIMARY KEY CLUSTERED ([Id]),
  UNIQUE NONCLUSTERED ([Codigo])
)
GO

IF OBJECT_ID('Categorias', 'U') IS NULL
CREATE TABLE [Categorias] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Nombre] NVARCHAR(100) NOT NULL,
  [Slug] NVARCHAR(100) NOT NULL,
  [IconoUrl] NVARCHAR(255) NULL,
  [Activo] BIT NULL DEFAULT ((1)),
  PRIMARY KEY CLUSTERED ([Id]),
  UNIQUE NONCLUSTERED ([Slug])
)
GO

IF OBJECT_ID('Configuracion', 'U') IS NULL
CREATE TABLE [Configuracion] (
  [Clave] NVARCHAR(50) NOT NULL,
  [Valor] NVARCHAR(1000) NULL,
  PRIMARY KEY CLUSTERED ([Clave])
)
GO

IF OBJECT_ID('Cupones', 'U') IS NULL
CREATE TABLE [Cupones] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Codigo] NVARCHAR(40) NOT NULL,
  [Descripcion] NVARCHAR(200) NULL,
  [Tipo] NVARCHAR(20) NOT NULL,
  [Valor] DECIMAL(10,2) NOT NULL,
  [MinimoCompra] DECIMAL(10,2) NULL,
  [FechaInicio] DATETIME NULL,
  [FechaFin] DATETIME NULL,
  [UsosMaximos] INT NULL,
  [Usos] INT NOT NULL CONSTRAINT [DF_Cupones_Usos] DEFAULT ((0)),
  [Activo] BIT NOT NULL CONSTRAINT [DF_Cupones_Activo] DEFAULT ((1)),
  [FechaCreacion] DATETIME NOT NULL CONSTRAINT [DF_Cupones_FechaCreacion] DEFAULT (sysutcdatetime()),
  PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UQ_Cupones_Codigo] UNIQUE NONCLUSTERED ([Codigo]),
  CONSTRAINT [CK_Cupones_Tipo] CHECK ([Tipo]='monto' OR [Tipo]='porcentaje'),
  CONSTRAINT [CK_Cupones_Valor] CHECK ([Valor]>(0))
)
GO

IF OBJECT_ID('MigracionesAplicadas', 'U') IS NULL
CREATE TABLE [MigracionesAplicadas] (
  [Nombre] NVARCHAR(100) NOT NULL,
  [FechaAplicada] DATETIME NOT NULL CONSTRAINT [DF_MigracionesAplicadas_Fecha] DEFAULT (sysutcdatetime()),
  PRIMARY KEY CLUSTERED ([Nombre])
)
GO

IF OBJECT_ID('Ocasiones', 'U') IS NULL
CREATE TABLE [Ocasiones] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Nombre] NVARCHAR(80) NOT NULL,
  [Slug] NVARCHAR(80) NOT NULL,
  [Descripcion] NVARCHAR(300) NULL,
  [ImagenUrl] NVARCHAR(255) NULL,
  [Icono] NVARCHAR(40) NULL,
  [Orden] INT NOT NULL CONSTRAINT [DF_Ocasiones_Orden] DEFAULT ((0)),
  [Activo] BIT NOT NULL CONSTRAINT [DF_Ocasiones_Activo] DEFAULT ((1)),
  PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UQ_Ocasiones_Slug] UNIQUE NONCLUSTERED ([Slug])
)
GO

IF OBJECT_ID('ProductoOcasiones', 'U') IS NULL
CREATE TABLE [ProductoOcasiones] (
  [ProductoId] INT NOT NULL,
  [OcasionId] INT NOT NULL,
  CONSTRAINT [PK_ProductoOcasiones] PRIMARY KEY CLUSTERED ([ProductoId], [OcasionId])
)
GO

IF OBJECT_ID('Productos', 'U') IS NULL
CREATE TABLE [Productos] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Nombre] NVARCHAR(150) NOT NULL,
  [Descripcion] NVARCHAR(MAX) NULL,
  [Precio] DECIMAL(10,2) NOT NULL,
  [Stock] INT NULL DEFAULT ((0)),
  [CategoriaId] INT NULL,
  [ImagenPrincipalUrl] NVARCHAR(255) NULL,
  [Destacado] BIT NULL DEFAULT ((0)),
  [Activo] BIT NULL DEFAULT ((1)),
  [FechaCreacion] DATETIME NULL CONSTRAINT [DF_Productos_FechaCreacion] DEFAULT (sysutcdatetime()),
  [PrecioOferta] DECIMAL(10,2) NULL,
  [OfertaHasta] DATETIME NULL,
  PRIMARY KEY CLUSTERED ([Id])
)
GO

IF OBJECT_ID('ProductoImagenes', 'U') IS NULL
CREATE TABLE [ProductoImagenes] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [ProductoId] INT NULL,
  [Url] NVARCHAR(255) NOT NULL,
  [Orden] INT NULL DEFAULT ((0)),
  PRIMARY KEY CLUSTERED ([Id])
)
GO

IF OBJECT_ID('Suscriptores', 'U') IS NULL
CREATE TABLE [Suscriptores] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Email] NVARCHAR(150) NOT NULL,
  [Origen] NVARCHAR(30) NULL,
  [CuponId] INT NULL,
  [TokenBaja] NVARCHAR(64) NOT NULL,
  [Activo] BIT NOT NULL CONSTRAINT [DF_Suscriptores_Activo] DEFAULT ((1)),
  [FechaAlta] DATETIME NOT NULL CONSTRAINT [DF_Suscriptores_FechaAlta] DEFAULT (sysutcdatetime()),
  [FechaBaja] DATETIME NULL,
  PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UQ_Suscriptores_Email] UNIQUE NONCLUSTERED ([Email])
)
GO

IF OBJECT_ID('TrabajosGaleria', 'U') IS NULL
CREATE TABLE [TrabajosGaleria] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Titulo] NVARCHAR(150) NULL,
  [Orden] INT NOT NULL DEFAULT ((0)),
  [Activo] BIT NOT NULL DEFAULT ((1)),
  [FechaCreacion] DATETIME NOT NULL CONSTRAINT [DF_TrabajosGaleria_FechaCreacion] DEFAULT (sysutcdatetime()),
  PRIMARY KEY CLUSTERED ([Id])
)
GO

IF OBJECT_ID('TrabajosGaleriaImagenes', 'U') IS NULL
CREATE TABLE [TrabajosGaleriaImagenes] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [TrabajoId] INT NOT NULL,
  [ImagenUrl] NVARCHAR(500) NOT NULL,
  [Orden] INT NOT NULL DEFAULT ((0)),
  PRIMARY KEY CLUSTERED ([Id])
)
GO

IF OBJECT_ID('Usuarios', 'U') IS NULL
CREATE TABLE [Usuarios] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Nombre] NVARCHAR(100) NOT NULL,
  [Email] NVARCHAR(150) NOT NULL,
  [PasswordHash] NVARCHAR(255) NOT NULL,
  [Telefono] NVARCHAR(30) NULL,
  [Rol] NVARCHAR(20) NULL DEFAULT ('Cliente'),
  [FechaRegistro] DATETIME NULL CONSTRAINT [DF_Usuarios_FechaRegistro] DEFAULT (sysutcdatetime()),
  [PuedeComentar] BIT NOT NULL DEFAULT ((1)),
  [Activo] BIT NOT NULL DEFAULT ((1)),
  [EmailVerificado] BIT NOT NULL DEFAULT ((0)),
  [TokenVerificacion] NVARCHAR(100) NULL,
  [TokenRecuperacion] NVARCHAR(100) NULL,
  [TokenRecuperacionExpira] DATETIME NULL,
  PRIMARY KEY CLUSTERED ([Id]),
  UNIQUE NONCLUSTERED ([Email])
)
GO

IF OBJECT_ID('Direcciones', 'U') IS NULL
CREATE TABLE [Direcciones] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [UsuarioId] INT NULL,
  [Calle] NVARCHAR(150) NULL,
  [Numero] NVARCHAR(20) NULL,
  [Localidad] NVARCHAR(100) NULL,
  [Provincia] NVARCHAR(100) NULL,
  [CodigoPostal] NVARCHAR(20) NULL,
  PRIMARY KEY CLUSTERED ([Id])
)
GO

IF OBJECT_ID('Ordenes', 'U') IS NULL
CREATE TABLE [Ordenes] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [UsuarioId] INT NULL,
  [Estado] NVARCHAR(30) NULL DEFAULT ('Pendiente'),
  [Total] DECIMAL(10,2) NOT NULL,
  [MetodoPago] NVARCHAR(30) NULL,
  [MercadoPagoPreferenceId] NVARCHAR(100) NULL,
  [MercadoPagoPaymentId] NVARCHAR(100) NULL,
  [TipoEntrega] NVARCHAR(20) NULL,
  [DireccionId] INT NULL,
  [NumeroSeguimiento] NVARCHAR(100) NULL,
  [FechaCreacion] DATETIME NULL CONSTRAINT [DF_Ordenes_FechaCreacion] DEFAULT (sysutcdatetime()),
  [CostoEnvio] DECIMAL(10,2) NULL,
  [StockDescontado] BIT NOT NULL CONSTRAINT [DF_Ordenes_StockDescontado] DEFAULT ((0)),
  [Subtotal] DECIMAL(10,2) NULL,
  [CuponId] INT NULL,
  [CuponCodigo] NVARCHAR(40) NULL,
  [DescuentoCupon] DECIMAL(10,2) NULL,
  [DescuentoTransferencia] DECIMAL(10,2) NULL,
  PRIMARY KEY CLUSTERED ([Id])
)
GO

IF OBJECT_ID('OrdenDetalles', 'U') IS NULL
CREATE TABLE [OrdenDetalles] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [OrdenId] INT NULL,
  [ProductoId] INT NULL,
  [Cantidad] INT NOT NULL,
  [PrecioUnitario] DECIMAL(10,2) NOT NULL,
  [Personalizacion] NVARCHAR(MAX) NULL,
  PRIMARY KEY CLUSTERED ([Id])
)
GO

IF OBJECT_ID('Testimonios', 'U') IS NULL
CREATE TABLE [Testimonios] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [UsuarioId] INT NOT NULL,
  [Comentario] NVARCHAR(100) NOT NULL,
  [Calificacion] INT NOT NULL DEFAULT ((5)),
  [Activo] BIT NOT NULL DEFAULT ((1)),
  [FechaCreacion] DATETIME NOT NULL CONSTRAINT [DF_Testimonios_FechaCreacion] DEFAULT (sysutcdatetime()),
  PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UQ_Testimonios_Usuario] UNIQUE NONCLUSTERED ([UsuarioId]),
  CONSTRAINT [CK_Testimonios_Calificacion] CHECK ([Calificacion]>=(1) AND [Calificacion]<=(5))
)
GO

IF OBJECT_ID('Visitas', 'U') IS NULL
CREATE TABLE [Visitas] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [Fecha] DATETIME NOT NULL CONSTRAINT [DF_Visitas_Fecha] DEFAULT (sysutcdatetime()),
  PRIMARY KEY CLUSTERED ([Id])
)
GO

-- Relaciones entre tablas
IF OBJECT_ID('FK__Direccion__Usuar__5DCAEF64', 'F') IS NULL
ALTER TABLE [Direcciones] ADD CONSTRAINT [FK__Direccion__Usuar__5DCAEF64] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
IF OBJECT_ID('FK__OrdenDeta__Orden__66603565', 'F') IS NULL
ALTER TABLE [OrdenDetalles] ADD CONSTRAINT [FK__OrdenDeta__Orden__66603565] FOREIGN KEY ([OrdenId]) REFERENCES [Ordenes] ([Id])
IF OBJECT_ID('FK__OrdenDeta__Produ__6754599E', 'F') IS NULL
ALTER TABLE [OrdenDetalles] ADD CONSTRAINT [FK__OrdenDeta__Produ__6754599E] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id])
IF OBJECT_ID('FK__Ordenes__Direcci__628FA481', 'F') IS NULL
ALTER TABLE [Ordenes] ADD CONSTRAINT [FK__Ordenes__Direcci__628FA481] FOREIGN KEY ([DireccionId]) REFERENCES [Direcciones] ([Id])
IF OBJECT_ID('FK__Ordenes__Usuario__60A75C0F', 'F') IS NULL
ALTER TABLE [Ordenes] ADD CONSTRAINT [FK__Ordenes__Usuario__60A75C0F] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
IF OBJECT_ID('FK__ProductoI__Produ__5535A963', 'F') IS NULL
ALTER TABLE [ProductoImagenes] ADD CONSTRAINT [FK__ProductoI__Produ__5535A963] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id])
IF OBJECT_ID('FK__Productos__Categ__4F7CD00D', 'F') IS NULL
ALTER TABLE [Productos] ADD CONSTRAINT [FK__Productos__Categ__4F7CD00D] FOREIGN KEY ([CategoriaId]) REFERENCES [Categorias] ([Id])
IF OBJECT_ID('FK_Testimonios_Usuarios', 'F') IS NULL
ALTER TABLE [Testimonios] ADD CONSTRAINT [FK_Testimonios_Usuarios] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
IF OBJECT_ID('FK_TrabajosGaleriaImagenes_Trabajo', 'F') IS NULL
ALTER TABLE [TrabajosGaleriaImagenes] ADD CONSTRAINT [FK_TrabajosGaleriaImagenes_Trabajo] FOREIGN KEY ([TrabajoId]) REFERENCES [TrabajosGaleria] ([Id])
GO
