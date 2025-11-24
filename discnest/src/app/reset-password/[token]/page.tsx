import ResetPasswordClientPage from './reset-password-client';

export default function Page({ params }: { params: { token: string } }) {
  const { token } = params; // Allowed here (server component)

  return <ResetPasswordClientPage token={token} />;
}
