import { SignIn } from "@clerk/nextjs";
import { authConfigured } from "@/lib/auth";
export default function SignInPage() {
  return (
    <main className="setup">
      <a className="brand" href="/">
        cicero<span>.</span>
      </a>
      <h1>Your content, in your hands.</h1>
      {authConfigured() ? (
        <SignIn
          routing="path"
          path="/admin/sign-in"
          forceRedirectUrl="/admin"
          appearance={{
            variables: { colorPrimary: "#6d1426", borderRadius: "12px" },
          }}
        />
      ) : (
        <p>
          Sign-in is not configured yet. Follow README.md to connect your Clerk
          account.
        </p>
      )}
    </main>
  );
}
