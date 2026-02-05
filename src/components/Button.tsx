type ButtonProps = React.PropsWithChildren<{
  id: string;
  children: any;
  onClick?: () => void;
}>;

export const Button = ({ id, children, onClick }: ButtonProps) => (
  <button
    className="m-1 cursor-pointer bg-gray-200 px-3 shadow-md hover:bg-gray-300"
    id={id}
    onClick={onClick}
  >
    {children}
  </button>
);
