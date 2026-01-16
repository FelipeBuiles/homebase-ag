import { redirect } from "next/navigation";

export default async function GroceryListPage() {
  redirect("/groceries");
}
