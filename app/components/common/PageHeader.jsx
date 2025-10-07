// components/common/PageHeader.jsx
"use client";
export default function PageHeader({ title, desc, actions }) {
  return (
    <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {desc && <p className="page-header__desc mt-1">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
