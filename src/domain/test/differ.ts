export function differ(somethingTodo: () => void): void {
  setTimeout(somethingTodo, 0);
}
