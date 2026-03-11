import { requireScope } from "@/lib/auth";
import { getProducts } from "@/app/admin/turnero-actions";
import { ProductsSettings } from "../sections/products-settings";

export default async function ProductosPage() {
  await requireScope("turnero:productos");

  const products = await getProducts();

  return <ProductsSettings products={products} />;
}
