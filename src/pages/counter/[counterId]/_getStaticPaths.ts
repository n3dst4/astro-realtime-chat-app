export function getStaticPaths() {
  return [
    { params: { counterId: "cats" } },
    { params: { counterId: "birds" } },
  ];
}
