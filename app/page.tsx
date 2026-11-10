import { currentEmail } from "@/lib/session";
import LoginForm from "./login-form";
import ExeApp from "./exe-app";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const email = await currentEmail();
  const { e } = await searchParams;
  if (!email) return <LoginForm motivo={e} />;
  return <ExeApp />;
}
