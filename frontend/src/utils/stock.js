// Desde cuántas unidades un producto activo se avisa en el panel como "stock bajo"
export const STOCK_BAJO = 3

export const tieneStockBajo = p => Boolean(p.Activo) && p.Stock <= STOCK_BAJO
