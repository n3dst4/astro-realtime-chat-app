import { authClient } from "@/lib/auth-client";
import { LogOut, Settings } from "lucide-react";
import { useRef } from "react";

type UserInfo = {
  name: string | null;
  email: string;
  image: string | null;
};

type Props = {
  initialUser: UserInfo | null;
};

export function NavBarAccount({ initialUser }: Props) {
  const { data: sessionData, isPending } = authClient.useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  // While the client-side session is still loading, use the server-provided
  // initial state so there's no skeleton flash or layout shift.
  const user: UserInfo | null = isPending
    ? initialUser
    : sessionData?.user
      ? {
          name: sessionData.user.name ?? null,
          email: sessionData.user.email,
          image: sessionData.user.image ?? null,
        }
      : null;

  function closeMenu() {
    menuRef.current?.hidePopover();
  }

  async function handleLogOut() {
    closeMenu();
    await authClient.signOut();
    window.location.href = "/";
  }

  if (!user) {
    return (
      <a href="/signin" className="btn btn-primary btn-sm">
        Sign in
      </a>
    );
  }

  const initials = getInitials(user.name, user.email);

  return (
    <>
      <button
        className="btn btn-ghost btn-circle"
        popoverTarget="nav-user-menu"
        style={{ anchorName: "--nav-user-menu" } as React.CSSProperties}
      >
        <AvatarDisplay
          image={user.image}
          name={user.name}
          initials={initials}
        />
      </button>
      <div
        id="nav-user-menu"
        ref={menuRef}
        popover="auto"
        className="dropdown dropdown-end rounded-box bg-base-100 ring-base-200
          w-56 shadow-lg ring-1"
        style={{ positionAnchor: "--nav-user-menu" } as React.CSSProperties}
      >
        <div className="border-base-200 border-b px-4 py-3">
          {user.name && <p className="truncate font-semibold">{user.name}</p>}
          <p className="truncate text-xs opacity-60">{user.email}</p>
        </div>
        <ul className="menu p-2">
          <li>
            <a href="/account" onClick={closeMenu}>
              <Settings size={16} />
              Account Settings
            </a>
          </li>
          <li>
            <button onClick={handleLogOut}>
              <LogOut size={16} />
              Log out
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return email[0].toUpperCase();
}

function AvatarDisplay({
  image,
  name,
  initials,
}: {
  image: string | null;
  name: string | null;
  initials: string;
}) {
  if (image) {
    return (
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={image} alt={name ?? "User avatar"} />
        </div>
      </div>
    );
  }

  return (
    <div className="avatar avatar-placeholder">
      <div className="bg-primary text-primary-content w-10 rounded-full">
        <span className="text-sm font-semibold">{initials}</span>
      </div>
    </div>
  );
}
