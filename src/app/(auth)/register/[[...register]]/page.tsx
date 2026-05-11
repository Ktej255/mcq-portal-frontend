import LoginPage from "@/app/(auth)/login/[[...login]]/page";

// With Google Auth, register and login can be the same flow.
export default function RegisterPage() {
  return <LoginPage />;
}
