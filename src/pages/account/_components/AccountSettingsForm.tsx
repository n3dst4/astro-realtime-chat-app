import { ChangeEmailSection } from "./ChangeEmailSection";
import { ChangeNameSection } from "./ChangeNameSection";
import { ChangePasswordSection } from "./ChangePasswordSection";
import { authClient } from "@/lib/auth-client";

type InitialUser = {
  name: string | null;
  email: string;
};

type Props = {
  initialUser: InitialUser;
};

export function AccountSettingsForm({ initialUser }: Props) {
  const { data: sessionData } = authClient.useSession();

  const name = sessionData?.user?.name ?? initialUser.name;
  const email = sessionData?.user?.email ?? initialUser.email;

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <ChangeNameSection currentName={name ?? ""} />
      <ChangeEmailSection currentEmail={email} />
      <ChangePasswordSection />
    </div>
  );
}
