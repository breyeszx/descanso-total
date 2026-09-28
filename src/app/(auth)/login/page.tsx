import { AuthForm } from "../auth-form";
import { login } from "../actions";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm modo="login" action={login} next={next} />;
}
