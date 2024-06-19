type Props = {
  name: string;
  status: string | null;
  className: string;
};

export const Badge = ({ name, status, className }: Props) => (
  <div className="flex items-center gap-1">
    <span>{name}</span>
    <span className={`badge ${className}`}>{status}</span>
  </div>
);
