import { AuthForm } from "../auth-form";
import { registro } from "../actions";

export const metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return <AuthForm modo="registro" action={registro} />;
}
