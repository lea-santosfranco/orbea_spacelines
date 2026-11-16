// En-tête commun des pages d'administration : titre, sous-titre et actions à droite
function AdminPageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[32px] font-extrabold leading-[1.1]">{title}</h1>
        {subtitle && <p className="mt-2 text-brume">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

export default AdminPageHeader;
