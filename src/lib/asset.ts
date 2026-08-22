/** Пути к файлам из public с учётом base (на GitHub Pages приложение живёт в /meat5/). */
export const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`
