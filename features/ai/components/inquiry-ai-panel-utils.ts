export function getScrollTopAfterPrepend({
  previousScrollHeight,
  previousScrollTop,
  nextScrollHeight,
}: {
  previousScrollHeight: number;
  previousScrollTop: number;
  nextScrollHeight: number;
}) {
  return nextScrollHeight - previousScrollHeight + previousScrollTop;
}

export function isScrollNearBottom({
  scrollHeight,
  scrollTop,
  clientHeight,
  threshold = 96,
}: {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
  threshold?: number;
}) {
  return scrollTop + clientHeight >= scrollHeight - threshold;
}

export function mergeChronologicalMessages<T extends { id: string }>(
  olderMessages: T[],
  currentMessages: T[],
) {
  const currentIds = new Set(currentMessages.map((message) => message.id));

  return [
    ...olderMessages.filter((message) => !currentIds.has(message.id)),
    ...currentMessages,
  ];
}
