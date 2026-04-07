export type PaginationOptions = {
  totalItems: number
  itemsPerPage: number
  currentPage: number
}

export function calculatePaginationInfo(options: PaginationOptions) {
  const { totalItems, itemsPerPage, currentPage } = options
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const validPage = Math.max(1, Math.min(currentPage, totalPages))
  const offset = (validPage - 1) * itemsPerPage
  
  return {
    totalPages,
    currentPage: validPage,
    offset,
    itemsOnPage: Math.min(itemsPerPage, totalItems - offset),
  }
}

export function generatePaginationPages(
  currentPage: number,
  totalPages: number,
  maxVisible = 7,
) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []
  const leftSide = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const rightSide = Math.min(
    totalPages,
    leftSide + maxVisible - 1,
  )

  if (leftSide > 1) {
    pages.push(1)
    if (leftSide > 2) {
      pages.push("...")
    }
  }

  for (let i = leftSide; i <= rightSide; i++) {
    pages.push(i)
  }

  if (rightSide < totalPages) {
    if (rightSide < totalPages - 1) {
      pages.push("...")
    }
    pages.push(totalPages)
  }

  return pages
}
