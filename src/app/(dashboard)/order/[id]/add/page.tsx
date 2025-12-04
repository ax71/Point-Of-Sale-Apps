import AddOrderItem from "./_components/add-order-item";

const metadata = {
  title: "CAFE-IN | Order Management",
};

export default async function AddOrderItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AddOrderItem id={id} />;
}
