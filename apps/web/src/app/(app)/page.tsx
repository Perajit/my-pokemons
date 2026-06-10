import { redirect } from "next/navigation";

// The collection list lives at /collection; / is the landing route and
// redirects there (leaves room for a real home page later).
export default function Home() {
  redirect("/collection");
}
