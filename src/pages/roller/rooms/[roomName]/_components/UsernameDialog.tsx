import { generateRandomName } from "./generateRandomName";
import { memo, useId, useLayoutEffect, useRef, useState } from "react";

type UsernameDialogProps = {
  initialUsername: string;
  onSetUsername: (username: string) => void;
};

export const UsernameDialog = memo(
  ({ initialUsername, onSetUsername }: UsernameDialogProps) => {
    const usernameDialogRef = useRef<HTMLDialogElement>(null);
    const dialogId = useId();
    const [username, setUsername] = useState(
      initialUsername ?? generateRandomName(),
    );

    useLayoutEffect(() => {
      if (usernameDialogRef.current && initialUsername === "") {
        usernameDialogRef.current.showModal();
      }
    }, [initialUsername]);

    return (
      <>
        <div
          className="text-middle inline-flex h-(--size) flex-col justify-center"
        >
          {initialUsername}
        </div>
        <button
          className="btn btn-secondary btn-sm btn-link"
          command="show-modal"
          commandfor={dialogId}
        >
          Edit
        </button>

        <dialog
          id={dialogId}
          ref={usernameDialogRef}
          closedby="none"
          className="animate-fadeout open:animate-fadein
            backdrop:animate-fadeout open:backdrop:animate-fadein prose absolute
            m-auto max-w-200 min-w-1/2 flex-col rounded-lg bg-pink-300 p-4 px-4
            text-base shadow-lg
            [transition:display_300ms_allow-discrete,overlay_300ms_allow-discrete]
            backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex
            dark:bg-pink-900"
        >
          <h2 className="">Pick a username</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSetUsername(username);
              usernameDialogRef?.current?.close();
            }}
          >
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-primary"
            />
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                setUsername(generateRandomName);
              }}
            >
              Generate random
            </button>
            <button className="btn btn-primary">Save</button>
          </form>
        </dialog>
      </>
    );
  },
);
